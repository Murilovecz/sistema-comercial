'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const storageSource = readFileSync(join(__dirname, '../public/foundation-storage.js'), 'utf8');
const uiSource = readFileSync(join(__dirname, '../public/foundation-ui.js'), 'utf8');
function memoryStorage() {
  const values = new Map();
  return {
    get length() {return values.size;},
    key(index) {return [...values.keys()][index] ?? null;},
    getItem(key) {return values.get(String(key)) ?? null;},
    setItem(key, value) {values.set(String(key), String(value));},
    removeItem(key) {values.delete(String(key));}
  };
}
function runtime(withUi = false) {
  const context = {localStorage: memoryStorage(), sessionStorage: memoryStorage(), AbortController, setTimeout, clearTimeout,
    extraPageTitles: {}, extraPageHandlers: {}, navigationGroups: [{id: 'administration', pages: []}]};
  context.window = context; vm.createContext(context); vm.runInContext(storageSource, context);
  if (withUi) vm.runInContext(uiSource, context);
  return context;
}
function scope(userId, companyId, unitId) {return {userId, companyId, unitId};}
test('rascunhos legados permanecem intactos sem serem atribuídos a qualquer usuário', () => {
  const c = runtime();
  c.localStorage.setItem('draft', 'rascunho legado'); c.sessionStorage.setItem('draft', 'aba antiga');
  for (const storage of [c.scopedLocalStorage, c.scopedSessionStorage]) {
    assert.equal(storage.getItem('draft'), null); storage.setItem('draft', 'ignorado'); storage.removeItem('draft'); storage.clear();
  }
  c.foundationSetStorageScope(scope('u', 'empresa', 'unidade'));
  assert.equal(c.scopedLocalStorage.getItem('draft'), null); assert.equal(c.scopedSessionStorage.getItem('draft'), null);
  assert.equal(c.localStorage.getItem('draft'), 'rascunho legado'); assert.equal(c.sessionStorage.getItem('draft'), 'aba antiga');
});
test('usuário, empresa e unidade isolam rascunhos e clear apaga apenas o namespace ativo', () => {
  const c = runtime();
  const contexts = [scope('u1', 'empresa1', 'unidade1'), scope('u2', 'empresa1', 'unidade1'), scope('u1', 'empresa2', 'unidade1'), scope('u1', 'empresa1', 'unidade2')];
  for (const [index, identity] of contexts.entries()) {
    c.foundationSetStorageScope(identity);
    assert.equal(c.scopedLocalStorage.getItem('draft'), null); assert.equal(c.scopedSessionStorage.getItem('draft'), null);
    c.scopedLocalStorage.setItem('draft', index); c.scopedSessionStorage.setItem('draft', index);
  }
  c.foundationSetStorageScope(contexts[1]); c.scopedLocalStorage.clear(); c.scopedSessionStorage.clear();
  for (const [index, identity] of contexts.entries()) {
    c.foundationSetStorageScope(identity);
    assert.equal(c.scopedLocalStorage.getItem('draft'), index === 1 ? null : String(index));
    assert.equal(c.scopedSessionStorage.getItem('draft'), index === 1 ? null : String(index));
    assert.equal(c.scopedLocalStorage.length, index === 1 ? 0 : 1);
    assert.equal(c.scopedLocalStorage.key(0), index === 1 ? null : 'draft');
  }
  c.foundationSetStorageScope(null); assert.equal(c.scopedLocalStorage.length, 0); assert.equal(c.scopedLocalStorage.getItem('draft'), null);
});
test('headers usam contexto em memória e não promovem dados de localStorage a autoridade', () => {
  const c = runtime(true);
  c.localStorage.setItem('companyId', 'empresa manipulada'); c.sessionStorage.setItem('csrfToken', 'token manipulado');
  assert.equal(c.foundationHeaders()['X-Company-ID'], undefined);
  c.foundationContext = {user: {id: 'u'}, companyId: 'real', unitId: 'real-unidade', permissions: [], csrfToken: 'csrf-em-memoria'};
  const headers = c.foundationHeaders({});
  assert.equal(headers['X-Company-ID'], 'real'); assert.equal(headers['X-Unit-ID'], 'real-unidade'); assert.equal(headers['X-CSRF-Token'], 'csrf-em-memoria');
  assert.equal(c.foundationHeaders()['X-CSRF-Token'], undefined);
  assert.equal(c.localStorage.length, 1); assert.equal(c.sessionStorage.length, 1);
  assert.equal(c.localStorage.getItem('csrfToken'), null);
});
test('perfil sem leitura financeira não solicita snapshot nem renderiza o painel comercial', async () => {
  const c = runtime(true); let commercialCalls = 0, restrictedCalls = 0;
  c.filterMemory = {};
  c.api = async () => {commercialCalls++; throw Error('Não deveria ser chamado');};
  c.foundationRestrictedHome = () => {restrictedCalls++;};
  await c.foundationEnter({user: {id: 'u', name: 'Pessoa'}, companyId: 'a', unitId: '1', contexts: [], csrfToken: 'm', permissions: ['catalog.view', 'inventory.view', 'sales.view', 'operations.view']});
  assert.equal(commercialCalls, 0); assert.equal(restrictedCalls, 1);
});
test('erro de contexto limpa dados visíveis e recarrega sem reenviar a gravação', async () => {
  const c = runtime(true); let calls = 0, reloads = 0, removedDialogs = 0;
  c.app = {innerHTML: 'dados antigos'}; c.state = {products: [{id: 'segredo'}], customers: [], sales: []}; c.cart = [{productId: 'segredo'}];
  c.saleRequestId = 'antes'; c.deskBook = {rows: ['rascunho']}; c.serviceCustomerId = 'cliente'; c.renderedPage = 'sales';
  c.filterMemory = {sales: {search: 'cliente'}}; c.tablePreferences = {sales: {page: 2}};
  c.document = {querySelectorAll: () => [{remove: () => removedDialogs++}], querySelector: () => null};
  c.location = {reload: () => reloads++};
  c.foundationContext = {user: {id: 'u'}, companyId: 'a', unitId: '1', csrfToken: 'm', permissions: []};
  c.foundationSetStorageScope(scope('u', 'a', '1')); c.scopedLocalStorage.setItem('draft', 'preservado');
  c.fetch = async () => {calls++; return {ok: false, status: 409, json: async () => ({code: 'CONTEXT_CHANGED', error: 'Contexto alterado'})};};
  await assert.rejects(c.foundationRequest('/api/foundation/roles', {name: 'papel'}), error => error.status === 409);
  assert.equal(calls, 1); assert.equal(reloads, 1); assert.equal(removedDialogs, 1); assert.equal(c.foundationContext, null);
  assert.equal(c.state.products.length, 0); assert.equal(c.cart.length, 0); assert.equal(c.deskBook, null); assert.equal(c.scopedLocalStorage.getItem('draft'), null);
  assert.equal(Object.keys(c.filterMemory).length, 0); assert.equal(Object.keys(c.tablePreferences).length, 0);
  c.foundationSetStorageScope(scope('u', 'a', '1')); assert.equal(c.scopedLocalStorage.getItem('draft'), 'preservado');
});
test('credencial inválida não reinicia a tela nem repete o login', async () => {
  const c = runtime(true); let lostSession = 0, calls = 0;
  c.foundationLostSession = () => lostSession++;
  c.fetch = async () => {calls++; return {ok: false, status: 401, json: async () => ({error: 'Credenciais inválidas'})};};
  await assert.rejects(c.foundationRequest('/api/auth/login', {login: 'u', password: 'somente fixture'}), error => error.status === 401);
  assert.equal(lostSession, 0); assert.equal(calls, 1); assert.equal(c.localStorage.length, 0); assert.equal(c.sessionStorage.length, 0);
});
