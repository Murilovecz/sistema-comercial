/* A interface utiliza a sessão do servidor; não persiste senhas ou tokens. */
window.foundationContext = null;
let foundationCsrf = null, foundationRestricted = false, foundationStarting = null;
const foundationReadPermissions = ['catalog.view', 'inventory.view', 'sales.view', 'financial.view', 'operations.view'];
function foundationHas(permission) { return !!window.foundationContext?.permissions.includes(permission); }
function foundationHeaders(body) {
  const headers = {};
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    const csrf = window.foundationContext?.csrfToken || foundationCsrf;
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  const ctx = window.foundationContext;
  if (ctx?.companyId && ctx.unitId) {
    headers['X-Company-ID'] = ctx.companyId;
    headers['X-Unit-ID'] = ctx.unitId;
  }
  return headers;
}
async function foundationRequest(url, body) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {credentials: 'same-origin', headers: foundationHeaders(body),
      ...(body !== undefined ? {method: 'POST', body: JSON.stringify(body)} : {}), signal: controller.signal});
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Não foi possível concluir esta operação.');
      error.status = response.status; error.code = data.code;
      if ((response.status === 401 && !url.startsWith('/api/auth/')) || (response.status === 409 && data.code === 'CONTEXT_CHANGED')) foundationLostSession(error);
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError)
      throw new Error('Servidor sem resposta. Confira a conexão com o sistema e tente novamente.');
    throw error;
  } finally { clearTimeout(timer); }
}
function foundationClearView() {
  void window.organizationBranding?.load(null);
  if (typeof commercialStopRead === 'function') commercialStopRead();
  window.foundationContext = null;
  window.foundationSetStorageScope(null);
  document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
  document.querySelector('#printReceipt')?.remove();
  state = {products: [], customers: [], sales: []}; cart = []; saleRequestId = null;
  deskBook = null; serviceCustomerId = ''; renderedPage = null; foundationRestricted = false;
  for (const key of Object.keys(filterMemory)) delete filterMemory[key];
  for (const key of Object.keys(tablePreferences)) delete tablePreferences[key];
  app.innerHTML = '';
}
function foundationLostSession(error) {
  foundationClearView();
  foundationCsrf = null;
  app.innerHTML = error?.code === 'CONTEXT_CHANGED'
    ? '<section class="login"><h1>Unidade alterada em outra aba</h1><p>Atualizando o contexto. A operação não será reenviada automaticamente.</p></section>'
    : '<section class="login"><h1>Sessão encerrada</h1><p>Entre novamente para continuar.</p></section>';
  // Recomeçar todos os módulos impede reutilizar rascunhos ainda em memória.
  location.reload();
}
function foundationAuthScreen(needsSetup, errorMessage = '') {
  foundationClearView();
  app.innerHTML = '<section class="login"><div class="brand">Sistema<span>Comercial</span></div>' +
    '<span class="badge">FUNDAÇÃO V1.1 · LOCAL</span><h1>' + (needsSetup ? 'Prepare seu primeiro acesso.' : 'Entre no seu sistema.') + '</h1>' +
    '<p class="muted">' + (needsSetup ? 'Cadastre seu usuário e uma senha pessoal. Os dados existentes da loja serão preservados.' : 'Use o login e a senha cadastrados para sua loja.') + '</p>' +
    '<form id="foundationAuth" novalidate>' +
    (needsSetup ? field('Seu nome', 'foundationName', 'text', 'required maxlength="120" autocomplete="name"') : '') +
    field('Login', 'foundationLoginName', 'text', 'required maxlength="120" autocomplete="username" autocapitalize="none"') +
    field('Senha', 'foundationPassword', 'password', 'required ' + (needsSetup ? 'minlength="12" ' : '') + 'maxlength="128" autocomplete="' + (needsSetup ? 'new-password' : 'current-password') + '"') +
    (needsSetup ? '<p class="muted">Use uma senha com 12 a 128 caracteres.</p>' + field('Código de instalação', 'foundationPairing', 'password', 'required autocomplete="off"') +
      '<p class="muted">O código está no arquivo PRIMEIRO-ACESSO.txt, dentro da pasta data do projeto. Ele confirma que este primeiro cadastro foi autorizado neste computador.</p>' : '') +
    '<p class="error form-error" role="alert">' + esc(errorMessage) + '</p><button class="wide">' + (needsSetup ? 'Criar meu acesso' : 'Entrar') + '</button></form></section>';
  const form = document.querySelector('#foundationAuth');
  form.onsubmit = async event => {
    event.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
    const input = {login: form.elements.foundationLoginName.value, password: form.elements.foundationPassword.value};
    if (needsSetup) {input.name = form.elements.foundationName.value; input.pairingToken = form.elements.foundationPairing.value;}
    try {
      await foundationRequest(needsSetup ? '/api/auth/setup' : '/api/auth/login', input);
      form.elements.foundationPassword.value = '';
      if (form.elements.foundationPairing) form.elements.foundationPairing.value = '';
      // Todos os módulos começam novamente antes de ler os rascunhos do usuário.
      location.reload();
    } catch (error) {formError(form, error.message); button.disabled = false;}
  };
  (needsSetup ? form.elements.foundationName : form.elements.foundationLoginName).focus();
}
async function foundationStart() {
  if (foundationStarting) return foundationStarting;
  foundationStarting = (async () => {
    try {
      const status = await foundationRequest('/api/auth/status'); foundationCsrf = status.csrfToken;
      if (status.authenticated) await foundationEnter(await foundationRequest('/api/auth/me'));
      else foundationAuthScreen(status.needsSetup);
    } catch (error) {
      foundationClearView();
      app.innerHTML = '<section class="login"><div class="brand">SistemaComercial</div><h1>Não foi possível abrir.</h1><p class="error" role="alert">' + esc(error.message) + '</p><button id="foundationRetry">Tentar novamente</button></section>';
      document.querySelector('#foundationRetry').onclick = () => foundationStart();
    }
  })();
  try {return await foundationStarting;} finally {foundationStarting = null;}
}
function foundationLogin() {return foundationStart();}
async function foundationEnter(context) {
  window.foundationContext = context; foundationCsrf = context.csrfToken;
  void window.organizationBranding?.load(context);
  if (!context.companyId || !context.unitId) return foundationChooseContext();
  window.foundationSetStorageScope({userId: context.user.id, companyId: context.companyId, unitId: context.unitId});
  scopedSessionStorage.setItem('demoUser', context.user.name);
  try {Object.assign(filterMemory, JSON.parse(scopedSessionStorage.getItem('pageFilters-v1') || '{}'));} catch {}
  foundationRestricted = !foundationReadPermissions.every(foundationHas);
  if (foundationRestricted) return foundationRestrictedHome();
  try {
    state = await api('/api/state'); restoreDraft(); page = 'dashboard'; render(); openInternalLink();
  } catch (error) {
    if (error.status === 403) {foundationRestricted = true; return foundationRestrictedHome();}
    throw error;
  }
}
function foundationContextOptions() {
  return (window.foundationContext?.contexts || []).map(context => '<option value="' + esc(JSON.stringify([context.companyId, context.unitId])) + '" ' +
    (context.companyId === window.foundationContext.companyId && context.unitId === window.foundationContext.unitId ? 'selected' : '') + '>' + esc(context.companyName + ' · ' + context.unitName) + '</option>').join('');
}
function foundationChooseContext(message = '') {
  document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
  app.innerHTML = '<section class="login"><h1>Selecione onde trabalhar.</h1><p>Olá, ' + esc(window.foundationContext.user.name) + '.</p>' +
    ((window.foundationContext.contexts || []).length ? '<form id="foundationChoose"><div class="field"><label for="foundationScope">Empresa e unidade</label><select id="foundationScope" required>' + foundationContextOptions() + '</select></div><p class="error" role="alert">' + esc(message) + '</p><button class="wide">Abrir unidade</button></form>' : '<p>Você ainda não possui acesso a uma unidade ativa. Peça ao responsável pela loja que revise seu acesso.</p>') + '<button id="logout" class="secondary spaced">Sair</button></section>';
  document.querySelector('#foundationChoose')?.addEventListener('submit', async event => {
    event.preventDefault(); try {await foundationChangeContext(document.querySelector('#foundationScope').value);} catch (error) {formError(event.target, error.message);}
  });
  document.querySelector('#logout').onclick = foundationLogout;
}
async function foundationChangeContext(value) {
  const [companyId, unitId] = JSON.parse(value);
  if (window.foundationContext?.companyId && !foundationRestricted) saveDraft();
  void window.organizationBranding?.load(null);
  await foundationRequest('/api/auth/context', {companyId, unitId}); location.reload();
}
async function foundationLogout() {
  void window.organizationBranding?.load(null);
  const button = document.querySelector('#logout'); if (button) button.disabled = true;
  try {
    if (!foundationRestricted && window.foundationContext?.companyId) saveDraft();
    await foundationRequest('/api/auth/logout', {}); foundationClearView(); location.reload();
  } catch (error) {if (button) button.disabled = false; if (error.status === 401) foundationLostSession(); else notice(error.message);}
}
function foundationAfterRender() {
  window.organizationBranding?.afterRender();
  const ctx = window.foundationContext; if (!ctx) return;
  const logout = document.querySelector('#logout'); if (logout) logout.onclick = foundationLogout;
  document.querySelectorAll('[data-page="foundationAdmin"]').forEach(button => button.hidden = !foundationHas('users.manage') || !foundationHas('roles.manage'));
  document.querySelectorAll('[data-page="foundationAudit"]').forEach(button => button.hidden = !foundationHas('audit.view'));
  const top = document.querySelector('main > header.top');
  if (top) {
    top.querySelector('#brandingSettings')?.remove();
    if (foundationHas('companies.manage')) {
      const settings = document.createElement('a'); settings.id = 'brandingSettings'; settings.className = 'branding-settings';
      settings.href = '/ui/appearance'; settings.textContent = 'Aparência'; top.append(settings);
    }
    top.querySelector('#foundationIdentity')?.remove();
    const identity = document.createElement('div'); identity.id = 'foundationIdentity'; identity.className = 'field'; identity.style.cssText = 'margin:0;max-width:340px;min-width:180px';
    identity.innerHTML = '<label for="foundationContextSelect">' + esc(ctx.user.name) + ' · Empresa e unidade</label><select id="foundationContextSelect">' + foundationContextOptions() + '</select>';
    top.insertBefore(identity, logout || null);
    identity.querySelector('select').onchange = async event => {
      const select = event.target; select.disabled = true;
      try {await foundationChangeContext(select.value);} catch (error) {notice(error.message); select.value = JSON.stringify([ctx.companyId, ctx.unitId]); select.disabled = false;}
    };
  }
}
function foundationRestrictedHome(selected = '') {
  foundationRestricted = true;
  if (typeof commercialPartialHome === 'function') return commercialPartialHome(selected);
  app.innerHTML = '<main><header class="top"><div><h1>Acesso da loja</h1><p class="muted">Seu perfil permite consultar as áreas abaixo.</p></div><button id="logout" class="secondary">Sair</button></header><div class="actions" id="foundationRestrictedNav"></div><div id="content" class="spaced"></div></main>';
  const nav = document.querySelector('#foundationRestrictedNav');
  for (const [key, label, allowed] of [['foundationAdmin', 'Usuários e acessos', foundationHas('users.manage') && foundationHas('roles.manage')], ['foundationAudit', 'Auditoria', foundationHas('audit.view')]]) {
    if (!allowed) continue;
    const button = document.createElement('button'); button.className = 'secondary'; button.textContent = label; button.onclick = () => foundationRestrictedHome(key); nav.append(button);
    selected ||= key;
  }
  foundationAfterRender();
  if (selected === 'foundationAdmin') foundationAdmin(); else if (selected === 'foundationAudit') foundationAudit();
  else document.querySelector('#content').innerHTML = '<section class="panel"><h2>Permissões de acesso</h2><p>O painel comercial desta versão reúne estoque, vendas e financeiro. Seu perfil ainda não possui todas as permissões de leitura necessárias para abri-lo. Peça ao responsável pela loja que revise suas permissões.</p></section>';
}
function foundationModal(title, content, submitLabel, onSubmit) {
  document.querySelector('#foundationDialog')?.remove();
  const dialog = document.createElement('dialog'); dialog.id = 'foundationDialog'; dialog.style.maxWidth = '700px';
  dialog.innerHTML = '<h2>' + esc(title) + '</h2><form novalidate>' + content + '<p class="error form-error" role="alert"></p><div class="actions"><button type="submit">' + esc(submitLabel) + '</button><button type="button" class="secondary" data-close>Cancelar</button></div></form>';
  document.body.append(dialog); dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault(); const button = event.target.querySelector('[type=submit]'); button.disabled = true;
    try {await onSubmit(event.target); dialog.close(); dialog.remove();} catch (error) {formError(event.target, error.message); button.disabled = false;}
  };
  dialog.addEventListener('close', () => dialog.remove(), {once: true}); dialog.showModal();
  dialog.querySelector('input,select,button')?.focus(); return dialog;
}
function foundationSelect(label, name, records, selected) {
  return '<div class="field"><label for="' + name + '">' + esc(label) + '</label><select id="' + name + '" name="' + name + '" required>' + records.map(record => '<option value="' + esc(record.id) + '" ' + (record.id === selected ? 'selected' : '') + '>' + esc(record.name) + '</option>').join('') + '</select></div>';
}
function foundationChecks(label, key, options, checked = []) {
  return '<fieldset style="border:1px solid #dce8e2;border-radius:9px;margin:18px 0;padding:16px"><legend>' + esc(label) + '</legend>' + options.map(option => '<label class="check-field"><input type="checkbox" name="' + key + '" value="' + esc(option.id) + '" ' + (checked.includes(option.id) ? 'checked' : '') + '>' + esc(option.name) + '</label>').join('') + '</fieldset>';
}
function foundationValues(form, key) {return [...form.querySelectorAll('[name="' + key + '"]:checked')].map(input => input.value);}
async function foundationAdmin() {
  const content = document.querySelector('#content'); content.innerHTML = '<section class="panel"><p role="status">Carregando usuários e acessos…</p></section>';
  try {
    const data = await foundationRequest('/api/foundation/admin'); if (!content.isConnected) return;
    const unitNames = new Map(data.units.map(unit => [unit.id, unit.name]));
    content.innerHTML = '<section class="panel"><div class="section-heading"><h2>Usuários e acessos</h2><button id="foundationNewUser">Cadastrar usuário</button></div><p class="muted">Cada usuário possui login próprio. As permissões são concedidas por papel e por unidade.</p>' +
      table(['Nome', 'Login', 'Vínculo com a empresa', 'Unidades e papéis', 'Ação'], data.users.map(user => '<tr><td>' + esc(user.name) + '</td><td>' + esc(user.login) + '</td><td>' + (user.status === 'active' ? 'Ativo' : 'Inativo') + '</td><td>' + user.units.map(unit => esc(unit.name || unitNames.get(unit.id) || unit.id) + ' · ' + (unit.status === 'active' ? 'Ativo' : 'Inativo') + '<br><small>' + esc(unit.roles.map(id => data.roles.find(role => role.id === id)?.name || id).join(', ') || 'Sem papel') + '</small>').join('<br>') + '</td><td><button class="secondary" data-foundation-access="' + esc(user.id) + '">Editar acesso</button></td></tr>')) +
      '</section><section class="panel spaced"><div class="section-heading"><h2>Papéis e permissões</h2><button id="foundationNewRole" class="secondary">Criar papel</button></div>' + table(['Papel', 'Permissões', 'Ação'], data.roles.map(role => '<tr><td>' + esc(role.name) + '</td><td>' + role.permissions.length + '</td><td><button class="secondary" data-foundation-role="' + esc(role.id) + '">Editar</button></td></tr>')) + '</section>' +
      '<section class="panel spaced"><h2>Empresas e unidades</h2><p>Unidades disponíveis nesta empresa: ' + esc(data.units.map(unit => unit.name).join(', ')) + '.</p><div class="actions">' +
      (foundationHas('units.manage') ? '<button class="secondary" id="foundationNewUnit">Criar unidade</button>' : '') + (foundationHas('companies.manage') ? '<button class="secondary" id="foundationNewCompany">Criar empresa</button>' : '') + '</div></section>';
    const redraw = async () => {window.foundationContext = await foundationRequest('/api/auth/me'); foundationCsrf = window.foundationContext.csrfToken; if (foundationRestricted) foundationRestrictedHome('foundationAdmin'); else await foundationAdmin(); foundationAfterRender();};
    document.querySelector('#foundationNewUser').onclick = () => foundationModal('Cadastrar usuário', field('Nome', 'name', 'text', 'required maxlength="120" autocomplete="name"') + field('Login', 'login', 'text', 'required maxlength="120" autocomplete="off" autocapitalize="none"') + field('Senha inicial', 'password', 'password', 'required minlength="12" maxlength="128" autocomplete="new-password"') + '<p class="muted">A senha deve ter 12 a 128 caracteres. Não será exibida na lista.</p>' + foundationSelect('Unidade', 'unitId', data.units.filter(unit => unit.status === 'active'), window.foundationContext.unitId) + foundationChecks('Papéis na unidade escolhida', 'roleIds', data.roles), 'Cadastrar', async form => {
      await foundationRequest('/api/foundation/users', {name: form.elements.name.value, login: form.elements.login.value, password: form.elements.password.value, unitId: form.elements.unitId.value, roleIds: foundationValues(form, 'roleIds')}); form.elements.password.value = ''; await redraw();
    });
    document.querySelectorAll('[data-foundation-access]').forEach(button => button.onclick = () => {
      const user = data.users.find(user => user.id === button.dataset.foundationAccess);
      const dialog = foundationModal('Acesso de ' + user.name, foundationSelect('Unidade', 'unitId', data.units, window.foundationContext.unitId) + foundationSelect('Situação do acesso à unidade', 'status', [{id: 'active', name: 'Ativo'}, {id: 'inactive', name: 'Inativo'}], 'active') + '<div id="foundationRoleAssignments"></div>', 'Salvar acesso', async form => {
        await foundationRequest('/api/foundation/access', {id: user.id, unitId: form.elements.unitId.value, status: form.elements.status.value, roleIds: foundationValues(form, 'roleIds')}); await redraw();
      });
      const update = () => {const unit = user.units.find(unit => unit.id === dialog.querySelector('[name=unitId]').value); dialog.querySelector('[name=status]').value = unit?.status || 'inactive'; dialog.querySelector('#foundationRoleAssignments').innerHTML = foundationChecks('Papéis nesta unidade', 'roleIds', data.roles, unit?.roles || []);};
      dialog.querySelector('[name=unitId]').onchange = update; update();
    });
    const roleEditor = role => foundationModal(role ? 'Editar papel' : 'Criar papel', field('Nome do papel', 'name', 'text', 'required maxlength="120" value="' + esc(role?.name || '') + '"') + foundationChecks('Permissões concedidas', 'permissions', data.permissions.map(permission => ({id: permission.code, name: permission.description + ' (' + permission.code + ')'})), role?.permissions), 'Salvar papel', async form => {
      await foundationRequest('/api/foundation/roles', {...(role ? {id: role.id} : {}), name: form.elements.name.value, permissions: foundationValues(form, 'permissions')}); await redraw();
    });
    document.querySelector('#foundationNewRole').onclick = () => roleEditor();
    document.querySelectorAll('[data-foundation-role]').forEach(button => button.onclick = () => roleEditor(data.roles.find(role => role.id === button.dataset.foundationRole)));
    document.querySelector('#foundationNewUnit')?.addEventListener('click', () => foundationModal('Criar unidade', field('Nome da unidade', 'name', 'text', 'required maxlength="120"') + '<p>Você terá acesso à nova unidade. Ela começa sem os cadastros e as operações da unidade atual.</p>', 'Criar unidade', async form => {await foundationRequest('/api/foundation/units', {name: form.elements.name.value}); await redraw();}));
    document.querySelector('#foundationNewCompany')?.addEventListener('click', () => foundationModal('Criar empresa', field('Nome da empresa', 'name', 'text', 'required maxlength="120"') + field('Nome da primeira unidade', 'unitName', 'text', 'required maxlength="120"') + '<p>Você receberá o acesso inicial de administração. Os dados da empresa atual permanecem na empresa atual.</p>', 'Criar empresa', async form => {await foundationRequest('/api/foundation/companies', {name: form.elements.name.value, unitName: form.elements.unitName.value}); await redraw();}));
  } catch (error) {if (content.isConnected) content.innerHTML = '<section class="panel"><p class="error" role="alert">' + esc(error.message) + '</p></section>';}
}
async function foundationAudit() {
  const content = document.querySelector('#content'); content.innerHTML = '<section class="panel"><p role="status">Carregando auditoria…</p></section>';
  try {
    const {events} = await foundationRequest('/api/foundation/audit'); if (!content.isConnected) return;
    content.innerHTML = '<section class="panel"><h2>Auditoria da unidade</h2><p class="muted">Últimos registros desta unidade, com executor identificado quando há usuário autenticado. Histórico anterior à Fundação V1 mantém a identificação original.</p>' + table(['Data', 'Ação', 'Registro', 'Executado por', 'Autorizado por', 'Detalhes'], events.map((event, index) => '<tr><td>' + esc(new Date(event.date).toLocaleString('pt-BR')) + '</td><td>' + esc(event.action) + '</td><td>' + esc(event.entity) + '<br><small>' + esc(event.recordId || event.record_id || '') + '</small></td><td>' + esc(event.executorName || event.executedByName || event.userName || event.executedBy || event.executed_by || 'Sistema / histórico sem executor') + '</td><td>' + esc(event.authorizedBy || event.authorized_by || 'Sem aprovação adicional') + '</td><td><button class="secondary" data-foundation-audit="' + index + '">Ver alteração</button></td></tr>'), 'Ainda não há registros de auditoria nesta unidade.') + '</section>';
    content.querySelectorAll('[data-foundation-audit]').forEach(button => button.onclick = () => {
      const event = events[Number(button.dataset.foundationAudit)];
      const before = event.before ?? event.before_json, after = event.after ?? event.after_json;
      const json = value => {if (typeof value === 'string') {try {value = JSON.parse(value);} catch {}} return esc(JSON.stringify(value ?? null, null, 2));};
      const dialog = foundationModal('Detalhes da alteração', '<p>' + esc(event.action + ' · ' + event.entity) + '</p><h3>Antes</h3><pre style="white-space:pre-wrap;overflow-wrap:anywhere">' + json(before) + '</pre><h3>Depois</h3><pre style="white-space:pre-wrap;overflow-wrap:anywhere">' + json(after) + '</pre>', 'Fechar', async () => {});
      dialog.querySelector('[data-close]').textContent = 'Voltar';
    });
  } catch (error) {if (content.isConnected) content.innerHTML = '<section class="panel"><p class="error" role="alert">' + esc(error.message) + '</p></section>';}
}
extraPageTitles.foundationAdmin = ['Usuários e acessos', 'Gerencie usuários, unidades, papéis e permissões da empresa.'];
extraPageHandlers.foundationAdmin = foundationAdmin;
extraPageTitles.foundationAudit = ['Auditoria', 'Confira ações e alterações registradas na unidade atual.'];
extraPageHandlers.foundationAudit = foundationAudit;
navigationGroups.find(group => group.id === 'administration').pages.push('foundationAdmin', 'foundationAudit');
