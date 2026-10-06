/* Consultas parciais: cada página recebe somente seu DTO autorizado. */
const commercialReadPages = [
  {key: 'catalog', title: 'Produtos', permission: 'catalog.view', endpoint: 'catalog', sort: 'name', status: true},
  {key: 'customers', title: 'Clientes', permission: 'catalog.view', endpoint: 'customers', sort: 'name', status: true},
  {key: 'suppliers', title: 'Fornecedores', permission: 'catalog.view', endpoint: 'suppliers', sort: 'name', status: true},
  {key: 'inventory', title: 'Estoque', permission: 'inventory.view', endpoint: 'inventory', sort: 'name'},
  {key: 'inventoryMovements', title: 'Histórico de estoque', permission: 'inventory.view', endpoint: 'inventory/movements', sort: 'date'},
  {key: 'sales', title: 'Vendas', permission: 'sales.view', endpoint: 'sales', sort: 'date'},
  {key: 'financial', title: 'Financeiro', permission: 'financial.view', endpoint: 'financial', sort: 'date'},
  {key: 'operations', title: 'Operações', permission: 'operations.view', endpoint: 'operations', sort: 'date'}
];
let commercialGeneration = 0, commercialController = null, commercialSearchTimer = null;
function commercialAllowedPages() {return commercialReadPages.filter(entry => foundationHas(entry.permission));}
function commercialContextKey() {
  const ctx = window.foundationContext;
  return ctx ? JSON.stringify([ctx.user.id, ctx.sessionId, ctx.companyId, ctx.unitId]) : null;
}
function commercialStopRead() {
  commercialGeneration++; commercialController?.abort(); commercialController = null;
  clearTimeout(commercialSearchTimer);
}
function commercialPartialHome(selected = '') {
  commercialStopRead();
  const choices = commercialAllowedPages();
  if (foundationHas('users.manage') && foundationHas('roles.manage')) choices.push({key: 'foundationAdmin', title: 'Usuários e acessos'});
  if (foundationHas('audit.view')) choices.push({key: 'foundationAudit', title: 'Auditoria'});
  const current = choices.find(entry => entry.key === selected) || choices[0];
  app.innerHTML = '<div class="shell"><aside><div class="brand">SistemaComercial</div><nav id="commercialNavigation">' +
    choices.map(entry => '<button type="button" data-commercial-page="' + esc(entry.key) + '" class="' + (current?.key === entry.key ? 'active' : '') + '" ' + (current?.key === entry.key ? 'aria-current="page"' : '') + '>' + esc(entry.title) + '</button>').join('') +
    '</nav><div class="aside-note">Fundação V1.1 · Local<br>Consultas conforme suas permissões.</div></aside><main><header class="top"><div><h1>' + esc(current?.title || 'Acesso da loja') + '</h1><p class="muted">Consulte os dados da unidade selecionada.</p></div><button id="logout" class="secondary">Sair</button></header><div id="content"></div></main></div>';
  document.querySelectorAll('[data-commercial-page]').forEach(button => button.onclick = () => foundationRestrictedHome(button.dataset.commercialPage));
  foundationAfterRender();
  if (!current) document.querySelector('#content').innerHTML = '<section class="panel"><h2>Seu acesso</h2><p>Seu perfil ainda não possui uma área de consulta. Peça ao responsável pela loja que revise seu acesso.</p></section>';
  else if (current.key === 'foundationAdmin') foundationAdmin();
  else if (current.key === 'foundationAudit') foundationAudit();
  else commercialReadPage(current);
}
function commercialDate(value) {
  if (!value) return 'Não informada';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {const [year,month,day]=value.split('-'); return day+'/'+month+'/'+year;}
  const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
}
function commercialMoney(value) {return Number.isSafeInteger(value) ? money(value) : 'Não informado';}
function commercialRows(entry, items) {
  const status = row => row.active === false ? 'Inativo' : 'Ativo';
  const schemas = {
    catalog: {headers: ['Produto', 'Código interno', 'Código de barras', 'Categoria', 'Preço de venda', 'Situação'], rows: items.map(row => [row.name, row.code || '—', row.barcode || '—', row.category || '—', commercialMoney(row.priceCents), status(row)])},
    customers: {headers: ['Cliente', 'Telefone', 'E-mail', 'Situação'], rows: items.map(row => [row.name, row.phone || '—', row.email || '—', status(row)])},
    suppliers: {headers: ['Fornecedor', 'Telefone', 'E-mail', 'Situação'], rows: items.map(row => [row.name, row.phone || '—', row.email || '—', status(row)])},
    inventory: {headers: ['Produto', 'Saldo', 'Unidade'], rows: items.map(row => [row.name, Number.isSafeInteger(row.stock) ? row.stock : 'Não informado', row.unit || '—'])},
    inventoryMovements: {headers: ['Data', 'Produto', 'Tipo', 'Quantidade', 'Origem', 'Executado por', 'Autorizado por'], rows: items.map(row => [commercialDate(row.date || row.timestamp), row.productName || row.productId, row.type, row.quantity, [row.originType || row.type, row.originId || row.referenceId].filter(Boolean).join(' · '), row.executorName || row.executedBy || row.execution?.executorName || row.execution?.executedBy || 'Histórico sem executor verificado', row.authorizerName || row.authorizedBy || row.execution?.authorizedBy || 'Sem aprovação adicional'])},
    sales: {headers: ['Data', 'Cliente', 'Itens', 'Total comercial', 'Desconto', 'Situação'], rows: items.map(row => [commercialDate(row.date), row.customerName || 'Consumidor final', (row.items || []).map(item => item.quantity + ' × ' + (item.name || item.productId)).join('; '), commercialMoney(row.totalCents), commercialMoney(row.discountCents), row.cancelledAt ? 'Cancelada' : 'Registrada'])},
    financial: {headers: ['Data', 'Tipo', 'Descrição', 'Valor do registro', 'Saldo do documento'], rows: items.map(row => [commercialDate(row.date), ({expense:'Despesa',payable:'Conta a pagar',receipt:'Recebimento',receivable:'Conta a receber'})[row.type] || 'Registro financeiro', row.description || '—', commercialMoney(row.amountCents), row.remainingCents === undefined ? '—' : commercialMoney(row.remainingCents)])},
    operations: {headers: ['Operação', 'Data', 'Situação'], rows: items.map(row => [row.title || row.name || row.description || '—', commercialDate(row.date || row.dueDate), row.status || (row.cancelledAt ? 'Cancelada' : row.completedAt ? 'Concluída' : 'Aberta')])}
  };
  const schema = schemas[entry.key];
  const actions = typeof commercialRecordActions === 'function';
  const hasActions = actions && items.some(item => commercialRecordActions(entry, item));
  return table([...schema.headers, ...(hasActions ? [['sales','inventoryMovements'].includes(entry.key) ? 'Responsáveis / liberação' : 'Ações'] : [])], schema.rows.map((row, index) => '<tr>' + row.map(value => '<td>' + esc(value ?? '—') + '</td>').join('') + (hasActions ? '<td>' + commercialRecordActions(entry, items[index]) + '</td>' : '') + '</tr>'), 'Nenhum registro nesta consulta. Ajuste os filtros.');
}
function commercialReadPage(entry) {
  const content = document.querySelector('#content');
  const notes = {catalog: 'Pesquise por nome, código interno ou código de barras. Esta consulta mostra o preço de venda; custo e estoque possuem acessos próprios.', sales: 'Valores comerciais das vendas. Recebimentos, caixa, crédito e contas são consultados somente no Financeiro.', financial: 'Contas a receber, contas a pagar e baixas da unidade. Documentos e pagamentos aparecem separadamente; somar esta lista não representa o saldo financeiro.', inventoryMovements: 'Origens e responsáveis declarados ou verificados, sem atribuir autoria a registros antigos.'};
  const sorts = entry.sort === 'name' ? [['name', 'Nome'], ['code', 'Código'], ['id', 'Identificador']] : [['date', 'Data'], ['id', 'Identificador']];
  content.innerHTML = '<section class="panel" data-server-pagination><div class="section-heading"><h2>' + esc(entry.title) + '</h2><button type="button" id="commercialRefresh" class="secondary">Atualizar</button></div><p class="muted">' + esc(notes[entry.key] || 'Consulta limitada aos dados e às permissões desta área.') + '</p>' +
    '<form id="commercialFilters" class="row" novalidate>' + field('Pesquisar', 'commercialSearch', 'search', 'maxlength="120" placeholder="Digite para pesquisar" autocomplete="off"') +
    (entry.status ? '<div class="field"><label for="commercialStatus">Situação</label><select id="commercialStatus"><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></div>' : '') +
    (entry.key === 'sales' ? '<div class="field"><label for="commercialCancelled">Situação da venda</label><select id="commercialCancelled"><option value="all">Todas</option><option value="registered">Registradas</option><option value="cancelled">Canceladas</option></select></div>' + field('Data inicial', 'commercialFrom', 'date') + field('Data final', 'commercialTo', 'date') + field('Identificador do cliente', 'commercialCustomer', 'text', 'maxlength="120"') + field('Identificador do executor', 'commercialExecutor', 'text', 'maxlength="120"') : '') +
    '<div class="field"><label for="commercialSort">Ordenar por</label><select id="commercialSort">' + sorts.map(([key, label]) => '<option value="' + key + '">' + label + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="commercialDirection">Ordem</label><select id="commercialDirection"><option value="asc">Crescente</option><option value="desc">Decrescente</option></select></div>' +
    '<div class="field"><label for="commercialPageSize">Registros por página</label><select id="commercialPageSize"><option value="25">25</option><option value="50" selected>50</option><option value="100">100</option></select></div><div class="field"><button>Pesquisar</button></div></form>' +
    '<div class="actions"><button type="button" class="secondary" id="commercialClear">Limpar filtros</button></div><p id="commercialFeedback" role="status" aria-live="polite"></p><div id="commercialResults"></div>' +
    '<div class="actions spaced"><button type="button" class="secondary" id="commercialPrevious" disabled>Página anterior</button><span id="commercialPageLabel" role="status" aria-live="polite"></span><button type="button" class="secondary" id="commercialNext" disabled>Próxima página</button></div></section>';
  const form = content.querySelector('#commercialFilters'), results = content.querySelector('#commercialResults'), feedback = content.querySelector('#commercialFeedback');
  const previous = content.querySelector('#commercialPrevious'), next = content.querySelector('#commercialNext'), label = content.querySelector('#commercialPageLabel');
  let currentPage = 1, totalPages = 1;
  const load = async () => {
    commercialStopRead(); const generation = commercialGeneration, contextKey = commercialContextKey();
    const controller = new AbortController(); commercialController = controller;
    const timer = setTimeout(() => controller.abort('timeout'), 15000);
    previous.disabled = true; next.disabled = true; results.innerHTML = ''; label.textContent = ''; feedback.className = ''; feedback.textContent = 'Carregando consulta…';
    const params = new URLSearchParams({page: String(currentPage), pageSize: form.querySelector('#commercialPageSize').value, q: form.querySelector('#commercialSearch').value.trim(), sort: form.querySelector('#commercialSort').value, direction: form.querySelector('#commercialDirection').value});
    if (entry.status) params.set('status', form.querySelector('#commercialStatus').value);
    if (entry.key === 'sales') {
      params.set('cancelled', form.querySelector('#commercialCancelled').value);
      for (const [key,id] of [['from','commercialFrom'],['to','commercialTo'],['customerId','commercialCustomer'],['executorId','commercialExecutor']]) {
        const value = form.querySelector('#'+id).value.trim(); if (value) params.set(key,value);
      }
    }
    try {
      const response = await fetch('/api/commercial/' + entry.endpoint + '?' + params, {credentials: 'same-origin', headers: foundationHeaders(), signal: controller.signal});
      const data = await response.json();
      if (!content.isConnected || generation !== commercialGeneration || contextKey !== commercialContextKey()) return;
      if (!response.ok) {
        const error = new Error(data.error || 'Não foi possível carregar esta consulta.'); error.status = response.status; error.code = data.code;
        if (error.status === 401 || error.status === 409 && error.code === 'CONTEXT_CHANGED') foundationLostSession(error);
        throw error;
      }
      if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total) || !Number.isSafeInteger(data.page) || !Number.isSafeInteger(data.totalPages)) throw new Error('A consulta retornou um formato inválido. Atualize o sistema.');
      currentPage = data.page; totalPages = Math.max(1, data.totalPages);
      results.innerHTML = commercialRows(entry, data.items);
      if (typeof commercialBindRowActions === 'function') commercialBindRowActions(entry, data.items, load);
      feedback.textContent = data.total + ' registro(s) encontrado(s).';
      label.textContent = 'Página ' + currentPage + ' de ' + totalPages;
      previous.disabled = currentPage <= 1; next.disabled = currentPage >= totalPages;
    } catch (error) {
      if (!content.isConnected || generation !== commercialGeneration || contextKey !== commercialContextKey()) return;
      if (controller.signal.aborted && controller.signal.reason !== 'timeout') return;
      feedback.className = 'error'; feedback.textContent = controller.signal.reason === 'timeout' ? 'Servidor sem resposta. Seus filtros foram mantidos; use Atualizar para tentar novamente.' : error.message || 'Não foi possível carregar esta consulta.';
    } finally {clearTimeout(timer); if (commercialController === controller) commercialController = null;}
  };
  const filterChanged = () => {currentPage = 1; load();};
  form.onsubmit = event => {event.preventDefault(); filterChanged();};
  form.querySelector('#commercialSearch').oninput = () => {commercialStopRead(); results.innerHTML = ''; label.textContent = ''; previous.disabled = true; next.disabled = true; feedback.textContent = 'Atualizando pesquisa…'; currentPage = 1; commercialSearchTimer = setTimeout(load, 300);};
  form.querySelectorAll('select').forEach(select => select.onchange = filterChanged);
  if (entry.key === 'sales') form.querySelectorAll('input[type=date]').forEach(input => input.onchange = filterChanged);
  content.querySelector('#commercialClear').onclick = () => {form.reset(); filterChanged(); form.querySelector('#commercialSearch').focus();};
  content.querySelector('#commercialRefresh').onclick = load;
  previous.onclick = () => {if (currentPage > 1) {currentPage--; load();}};
  next.onclick = () => {if (currentPage < totalPages) {currentPage++; load();}};
  if (typeof commercialAddPageActions === 'function') commercialAddPageActions(entry, content, load);
  load();
}
