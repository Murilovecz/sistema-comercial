/* Melhorias sobre o fluxo existente; DTO parcial nunca substitui state. */
let experienceCatalogObserver = null;
function experienceCanSell() {return ['catalog.view', 'sales.view', 'sales.create'].every(foundationHas);}
function experienceApprovalText(record) {
  const execution = record.execution || {};
  const parts = ['Executor: ' + (execution.executorName || execution.executedBy || 'histórico sem executor verificado')];
  if (execution.executorRoles?.length) parts.push('Papéis: ' + execution.executorRoles.join(', '));
  if (execution.authorizedBy) {
    parts.push('Liberado por: ' + (execution.approverName || execution.authorizedBy));
    if (execution.approverRoles?.length) parts.push('Papéis do autorizador: ' + execution.approverRoles.join(', '));
    parts.push('Motivo: ' + (execution.approvalReason || 'não informado'));
    if (execution.approvalId) parts.push('Autorização: ' + execution.approvalId);
  }
  if (record.inactiveAtSale || record.items?.some(item => item.inactiveAtSale)) parts.push('ITEM DESATIVADO VENDIDO COM LIBERAÇÃO');
  return parts.join(' · ');
}
function experienceRestoreFocus(opener) {if (opener?.isConnected) opener.focus();}
function experienceQuickView(kind, formSelector, titleSelector, editSelector) {
  experienceCatalogObserver?.disconnect();
  document.querySelector('#catalogQuickView')?.remove();
  const form = document.querySelector(formSelector), panel = form?.closest('.panel'); if (!panel) return;
  const list = document.querySelector('#content .section-heading'); if (!list) return;
  panel.parentElement.classList.remove('grid');
  const dialog = document.createElement('dialog'); dialog.id = 'catalogQuickView'; dialog.style.maxWidth = '650px';
  panel.style.cssText = 'padding:0;border:0;box-shadow:none'; dialog.append(panel);
  const close = document.createElement('button'); close.type = 'button'; close.className = 'secondary'; close.textContent = 'Fechar'; close.onclick = () => dialog.close(); dialog.append(close); document.body.append(dialog);
  let opener;
  const open = button => {opener = button; if (!dialog.open) dialog.showModal(); form.elements.name?.focus();};
  dialog.experienceOpen = open;
  dialog.addEventListener('close', () => experienceRestoreFocus(opener));
  const create = document.createElement('button'); create.type = 'button'; create.textContent = 'Cadastrar ' + ({products:'produto', customers:'cliente', suppliers:'fornecedor'})[kind]; create.disabled = !foundationHas('catalog.manage');
  create.dataset.quickCreate = 'true';
  list.append(create); create.onclick = () => {
    // A ação original recria o formulário e zera também a identidade da edição.
    const reset = form.querySelector('#newProduct,#newCustomer,#newSupplier');
    if (reset) reset.click(); else open(create);
  };
  const bindRows = () => {
    if (!dialog.isConnected) return;
    document.querySelectorAll(editSelector).forEach(button => {
      button.hidden = !foundationHas('catalog.manage'); if (button.dataset.quickViewBound) return;
      button.dataset.quickViewBound = 'true'; const original = button.onclick;
      button.onclick = event => {original?.call(button, event); open(button);};
    });
    document.querySelectorAll('[data-active],[data-supplier-active]').forEach(button => button.hidden = !foundationHas('catalog.manage'));
    if (kind === 'products') experienceBindProductRows();
  };
  bindRows();
  const observer = new MutationObserver(bindRows), resultList = document.querySelector(kind === 'suppliers' ? '#supplierList' : '#results');
  if (resultList) observer.observe(resultList, {childList:true, subtree:true});
  experienceCatalogObserver = observer;
  document.querySelectorAll('[data-active],[data-supplier-active]').forEach(button => button.hidden = !foundationHas('catalog.manage'));
  form.querySelector('#newProduct,#newCustomer,#newSupplier')?.addEventListener('click', () => queueMicrotask(() => document.querySelector('#catalogQuickView')?.experienceOpen(document.querySelector('[data-quick-create]'))));
  close.setAttribute('aria-label', 'Fechar cadastro'); dialog.setAttribute('aria-labelledby', titleSelector.slice(1));
}
function experienceClearFilters() {
  const filters = typeof filterInputs === 'function' ? filterInputs() : [];
  for (const input of filters) {
    if (input.closest('form,[data-server-pagination]')) continue;
    input.value = input.tagName === 'SELECT' ? ([...input.options].find(option => option.value === 'all' || option.value === '')?.value ?? input.options[0]?.value ?? '') : '';
    input.dispatchEvent(new Event('input', {bubbles:true})); input.dispatchEvent(new Event('change', {bubbles:true}));
  }
  delete filterMemory[page]; updateFilterChips();
}
function experienceAddClear() {
  if (document.querySelector('#content [data-server-pagination]') || document.querySelector('#clearPageFiltersVisible')) return;
  const inputs = filterInputs().filter(input => !input.closest('form'));
  if (!inputs.length) return;
  const button = document.createElement('button'); button.type = 'button'; button.id = 'clearPageFiltersVisible'; button.className = 'secondary'; button.textContent = 'Limpar filtros'; button.onclick = experienceClearFilters;
  const row = document.createElement('div'); row.className = 'actions'; row.style.margin = '14px 0'; row.append(button);
  const anchor = inputs[0].closest('.row') || inputs[0].closest('.field'); anchor?.after(row);
}
async function experienceProductCost(productId) {
  const context = commercialContextKey();
  try {
    const {cost} = await foundationRequest('/api/commercial/product-costs?productId=' + encodeURIComponent(productId));
    if (context !== commercialContextKey()) return;
    showInfo('Último custo recebido', cost ? '<p>Produto: ' + esc(cost.productName || '') + '</p>' + table(['Custo por unidade', 'Fornecedor', 'Recebido em', 'Origem'], ['<tr><td>' + money(cost.unitCostCents) + '</td><td>' + esc(cost.supplierName || '—') + '</td><td>' + esc(commercialDate(cost.date)) + '</td><td>' + esc(cost.purchaseId || '') + '</td></tr>']) + '<p class="muted">Fonte: recebimento de compra. Consulta sem novo lançamento; não representa custo médio ou lucro.</p>' : '<p>Nenhum custo recebido registrado para este produto. Estoque inicial e entradas antigas não recebem um custo presumido.</p>');
  } catch (error) {notice(error.message);}
}
function experienceReceiveProduct(product) {
  if (!product) return;
  page = 'purchases'; render();
  const filter = document.querySelector('#purchaseListProduct');
  if (filter) {filter.value = product.id; filter.dispatchEvent(new Event('input', {bubbles:true})); updateFilterChips();}
  const note = document.createElement('section'); note.className = 'panel'; note.innerHTML = '<h2>Receber compra de ' + esc(product.name) + '</h2><p>Abra o pedido do fornecedor correspondente e use Receber mercadorias. Se ainda não há pedido, prepare a compra pelo fluxo desta tela. O rascunho atual foi preservado.</p>';
  document.querySelector('#content').prepend(note);
}
function experienceStockHistory(product) {
  const entries = [...(state.stockMovements || []).filter(row => row.productId === product.id)];
  for (const entry of state.stockEntries || []) if (entry.productId === product.id && !entries.some(row => row.type === 'entry' && row.referenceId === entry.id)) entries.push({...entry, type:'entry', stockAfter:null});
  for (const sale of state.sales) for (const item of sale.items) if (item.productId === product.id) {
    if (!entries.some(row => row.type === 'sale' && row.referenceId === sale.id)) entries.push({type:'sale', date:sale.date, quantity:-item.quantity, referenceId:sale.id, stockAfter:null, execution:sale.execution, inactiveAtSale:item.inactiveAtSale});
    if (sale.cancelledAt && !entries.some(row => row.type === 'cancel' && row.referenceId === sale.id)) entries.push({type:'cancel', date:sale.cancelledAt, quantity:item.quantity, referenceId:sale.id, stockAfter:null});
  }
  const labels = {initial:'Estoque inicial', entry:'Entrada antiga', sale:'Venda', cancel:'Cancelamento', purchase:'Recebimento de compra', inventory:'Inventário', return:'Devolução'};
  showInfo('Estoque: ' + product.name, '<p>Saldo atual: ' + product.stock + ' un. Históricos sem saldo registrado mostram —.</p>' + table(['Data', 'Movimento', 'Quantidade', 'Saldo após', 'Origem', 'Responsáveis / liberação', 'Observação'], entries.sort((a,b) => String(b.date).localeCompare(String(a.date))).map(row => '<tr><td>' + esc(commercialDate(row.date)) + '</td><td>' + esc(labels[row.type] || row.type) + '</td><td>' + row.quantity + '</td><td>' + (row.stockAfter ?? '—') + '</td><td>' + esc(row.purchaseId || row.referenceId || row.id || '—') + '</td><td>' + esc(experienceApprovalText(row)) + '</td><td>' + esc(row.note || '—') + '</td></tr>')));
}
const experienceProductsPrevious = products;
products = function() {
  document.querySelector('#catalogQuickView')?.remove(); experienceProductsPrevious();
  const historical = [...document.querySelectorAll('#content section.panel h2')].find(heading => heading.textContent === 'Reposições manuais de estoque');
  if (historical) {historical.textContent = 'Entradas antigas de estoque'; const empty = historical.parentElement.querySelector('.empty'); if (empty) empty.textContent = 'Sem entradas antigas. Novos recebimentos devem ser registrados em Compras do fornecedor.';}
  experienceQuickView('products', '#register', '#formTitle', '[data-edit]'); experienceAddClear();
};
function experienceBindProductRows() {
  document.querySelectorAll('[data-stock]').forEach(button => {if (button.textContent !== 'Receber compra') button.textContent = 'Receber compra'; button.hidden = !foundationHas('purchases.manage'); button.onclick = () => experienceReceiveProduct(state.products.find(product => product.id === button.dataset.stock));});
  document.querySelectorAll('[data-movements]').forEach(button => {button.hidden = !foundationHas('inventory.view'); button.onclick = () => experienceStockHistory(state.products.find(product => product.id === button.dataset.movements));});
  if (foundationHas('catalog.view') && foundationHas('financial.view')) document.querySelectorAll('[data-edit]').forEach(button => {if (button.parentElement.querySelector('[data-received-cost]')) return; const cost = document.createElement('button'); cost.type = 'button'; cost.className = 'secondary'; cost.dataset.receivedCost = 'true'; cost.textContent = 'Custo recebido'; cost.onclick = () => experienceProductCost(button.dataset.edit); button.parentElement.append(cost);});
}
const experienceCustomersPrevious = customers;
customers = function() {document.querySelector('#catalogQuickView')?.remove(); experienceCustomersPrevious(); experienceQuickView('customers', '#register', '#formTitle', '[data-edit]'); experienceAddClear();};
const experienceSuppliersPrevious = suppliers;
suppliers = function() {document.querySelector('#catalogQuickView')?.remove(); experienceSuppliersPrevious(); experienceQuickView('suppliers', '#supplierForm', '#supplierTitle', '[data-supplier-edit]'); experienceAddClear();};
const experienceRenderPrevious = render;
render = function() {experienceCatalogObserver?.disconnect(); document.querySelector('#catalogQuickView')?.remove(); experienceRenderPrevious(); experienceAddClear(); if (experienceCanSell() && !document.querySelector('#directCommercialSale')) {const button = document.createElement('button'); button.id = 'directCommercialSale'; button.className = 'secondary'; button.textContent = 'Venda direta / item desativado'; button.onclick = () => experienceDirectSale(); document.querySelector('main > .top')?.after(button);}};
const experienceSaleDetailsPrevious = saleDetailsBody;
saleDetailsBody = function(record) {return experienceSaleDetailsPrevious(record) + '<section class="panel spaced"><h3>Responsáveis e liberação</h3><p>' + esc(experienceApprovalText(record)) + '</p></section>';};
const experienceSalesHistoryPrevious = salesHistory;
salesHistory = function(records = state.sales) {
  const template = document.createElement('template'); template.innerHTML = experienceSalesHistoryPrevious(records);
  for (const button of template.content.querySelectorAll('[data-details]')) {
    const record = records.find(record => record.id === button.dataset.details); if (!record) continue;
    const note = document.createElement('p'); note.className = 'muted'; note.textContent = experienceApprovalText(record); button.before(note);
  }
  return template.innerHTML;
};
function commercialRecordActions(entry, row) {
  if (['catalog','customers','suppliers'].includes(entry.key)) return (foundationHas('catalog.manage') ? '<button type="button" class="secondary" data-commercial-edit="' + esc(row.id) + '">Editar</button> <button type="button" class="secondary" data-commercial-active="' + esc(row.id) + '">' + (row.active === false ? 'Reativar' : 'Desativar') + '</button> ' : '') + (entry.key === 'catalog' && foundationHas('financial.view') ? '<button type="button" class="secondary" data-commercial-cost="' + esc(row.id) + '">Custo recebido</button>' : '');
  if (entry.key === 'sales' || entry.key === 'inventoryMovements') return '<span>' + esc(experienceApprovalText(row)) + '</span>';
  return '';
}
function commercialBindRowActions(entry, rows, refresh) {
  document.querySelectorAll('[data-commercial-edit]').forEach(button => button.onclick = () => experiencePartialEdit(entry.key, button.dataset.commercialEdit, refresh));
  document.querySelectorAll('[data-commercial-cost]').forEach(button => button.onclick = () => experienceProductCost(button.dataset.commercialCost));
  document.querySelectorAll('[data-commercial-active]').forEach(button => button.onclick = () => {const row = rows.find(row => row.id === button.dataset.commercialActive), kind = entry.key === 'catalog' ? 'products' : entry.key, requestId = crypto.randomUUID(); foundationModal('Alterar situação de ' + row.name, '<p>Históricos e vínculos permanecem preservados. Esta mudança não autoriza automaticamente a venda de um produto desativado.</p>', row.active === false ? 'Reativar' : 'Desativar', async () => {await foundationRequest('/api/commercial/' + kind + '/active', {id:row.id, expectedVersion:row.version || 0, active:row.active === false, requestId}); await refresh();});});
}
function commercialAddPageActions(entry, content, refresh) {
  if (['catalog','customers','suppliers'].includes(entry.key) && foundationHas('catalog.manage')) {const button = document.createElement('button'); button.textContent = 'Cadastrar ' + ({catalog:'produto',customers:'cliente',suppliers:'fornecedor'})[entry.key]; button.onclick = () => experiencePartialEdit(entry.key, null, refresh); content.querySelector('.section-heading').append(button);}
  if (entry.key === 'sales' && experienceCanSell()) {const button = document.createElement('button'); button.textContent = 'Nova venda direta'; button.onclick = () => experienceDirectSale(refresh); content.querySelector('.section-heading').append(button);}
}
async function experiencePartialEdit(key, id, refresh) {
  const kind = key === 'catalog' ? 'products' : key, context = commercialContextKey();
  try {
    const result = id ? await foundationRequest('/api/commercial/' + kind + '/by-id?id=' + encodeURIComponent(id)) : null, record = result?.record || null;
    if (context !== commercialContextKey()) return;
    const fields = field('Nome', 'name', 'text', 'required maxlength="120"') + (kind === 'products' ? field('Código interno', 'code', 'text', 'maxlength="40"') + field('Código de barras', 'barcode', 'text', 'maxlength="64" autocomplete="off"') + field('Categoria', 'category', 'text', 'maxlength="60"') + field('Preço de venda (R$)', 'price', 'number', 'required min="0" step="0.01"') + (!id && foundationHas('inventory.view') && foundationHas('inventory.adjust') ? field('Estoque inicial', 'stock', 'number', 'required min="0" step="1" value="0"') : '') + (foundationHas('inventory.view') && foundationHas('inventory.adjust') ? field('Estoque mínimo', 'minStock', 'number', 'min="0" step="1" value="0"') : '') : field('Telefone', 'phone', 'tel', 'maxlength="40"') + field('E-mail', 'email', 'email', 'maxlength="150"') + field('Observações', 'notes', 'text', 'maxlength="1000"'));
    let requestId = crypto.randomUUID();
    const dialog = foundationModal((id ? 'Editar ' : 'Cadastrar ') + ({products:'produto',customers:'cliente',suppliers:'fornecedor'})[kind], fields, 'Salvar', async form => {
      const input = {...Object.fromEntries(new FormData(form)), requestId, ...(id ? {id, expectedVersion:record.version || 0} : {})};
      if (!id && kind === 'products' && input.stock === undefined) input.stock = '0';
      const endpoint = '/api/commercial/' + kind + (id ? '/edit' : kind === 'suppliers' ? '/create' : '');
      await foundationRequest(endpoint, input); await refresh(); notice('Cadastro salvo.');
    });
    if (record) for (const input of dialog.querySelectorAll('input')) input.value = input.name === 'price' ? (record.priceCents / 100).toFixed(2) : record[input.name] ?? '';
    dialog.querySelector('form').oninput = () => requestId = crypto.randomUUID();
  } catch (error) {notice(error.message);}
}
function experienceDirectSale(refresh = null) {
  if (!experienceCanSell()) return notice('Seu perfil não permite criar esta venda.');
  document.querySelector('#directSaleDialog')?.remove();
  const opener = document.activeElement, dialog = document.createElement('dialog'); dialog.id = 'directSaleDialog'; dialog.style.maxWidth = '950px';
  dialog.innerHTML = '<h2>Venda direta</h2><p class="muted">Carrinho independente em unidades-base. O Balcão PDV e seus atendimentos continuam preservados. Produto desativado exige liberação por senha e motivo.</p><form id="directSaleForm" novalidate>' +
    '<div class="scanner-box"><div class="row">' + field('Código de barras, interno ou embalagem', 'directCode', 'text', 'maxlength="120" autocomplete="off"') + '<div class="field"><button type="button" id="directReadCode">Adicionar por código</button></div></div><p>Leitor com Enter ou digitação manual. Código de embalagem converte para unidades-base.</p></div>' +
    '<div class="row">' + field('Buscar produto por nome ou código', 'directProductSearch', 'search', 'maxlength="120"') + '<div class="field"><button type="button" id="directSearchProducts">Buscar produtos</button></div></div><div class="row"><div class="field"><label for="directProduct">Produto encontrado</label><select id="directProduct"><option value="">Pesquise um produto</option></select></div>' + field('Quantidade em unidades-base', 'directQuantity', 'number', 'min="1" step="1" value="1"') + '<div class="field"><button type="button" id="directAdd">Adicionar</button></div></div>' +
    '<div id="directCart"></div><div class="row">' + field('Buscar cliente pelo nome', 'directCustomerSearch', 'search', 'maxlength="120"') + '<div class="field"><button type="button" id="directSearchCustomers">Buscar clientes</button></div><div class="field"><label for="directCustomer">Cliente</label><select id="directCustomer"><option value="">Consumidor final</option></select></div></div>' +
    '<div class="row"><div class="field"><label for="directMethod">Forma declarada</label><select id="directMethod"><option value="cash">Dinheiro</option><option value="pix">Pix</option><option value="debit">Débito</option><option value="credit">Crédito</option><option value="other">Outro</option></select></div><div class="field"><label for="directStatus">Pagamento declarado</label><select id="directStatus"><option value="received">Recebido</option><option value="pending">A receber</option></select></div>' + field('Vencimento opcional', 'directDueDate', 'date', 'disabled') + '</div><p id="directCash" class="muted"></p><div class="row">' + field('Desconto total (R$)', 'directDiscount', 'number', 'required min="0" step="0.01" value="0"') + field('Motivo do desconto', 'directDiscountReason', 'text', 'maxlength="500"') + field('Justificativa de negociação, se necessária', 'directOfferReason', 'text', 'maxlength="500"') + '</div><p id="directFeedback" class="error" role="alert"></p><div class="actions"><button id="directPrepare" type="submit">Revisar preços e venda</button><button id="directClose" type="button" class="secondary">Fechar</button></div><div id="directReview" class="spaced"></div></form>';
  document.body.append(dialog); dialog.showModal();
  const form = dialog.querySelector('form'), feedback = form.querySelector('#directFeedback'), review = form.querySelector('#directReview'), cartBox = form.querySelector('#directCart');
  const context = commercialContextKey(); let lines = [], productsFound = [], requestId = crypto.randomUUID(), prepared = null, approval = null, busy = false, unresolved = false, searchGeneration = 0;
  const valid = () => dialog.isConnected && commercialContextKey() === context;
  const invalidate = () => {if (unresolved) return; requestId = crypto.randomUUID(); prepared = null; approval = null; review.innerHTML = ''; feedback.textContent = '';};
  const drawCart = () => {
    cartBox.innerHTML = table(['Produto', 'Situação', 'Quantidade-base', 'Ação'], lines.map((line, index) => '<tr><td>' + esc(line.product.name) + '</td><td>' + (line.product.active === false ? '<strong class="cancelled">DESATIVADO — exige liberação</strong>' : 'Ativo') + '</td><td>' + line.quantity + '</td><td><button type="button" class="secondary" data-direct-remove="' + index + '">Remover</button></td></tr>'), 'Adicione produtos por código ou busca manual.');
    cartBox.querySelectorAll('[data-direct-remove]').forEach(button => button.onclick = () => {if (busy || unresolved) return; lines.splice(Number(button.dataset.directRemove), 1); invalidate(); drawCart();});
  };
  const lock = () => {busy = true; const previous = [...form.querySelectorAll('input,select,button')].map(element => [element,element.disabled]); previous.forEach(([element]) => element.disabled = true); return () => {busy = false; previous.forEach(([element,disabled]) => element.disabled = disabled);};};
  const add = (product, quantity) => {if (!Number.isSafeInteger(quantity) || quantity < 1) throw Error('Informe quantidade inteira positiva.'); const old = lines.find(line => line.product.id === product.id); const total = quantity + (old?.quantity || 0); if (!Number.isSafeInteger(total)) throw Error('Quantidade fora do limite.'); if (old) old.quantity = total; else lines.push({product,quantity}); invalidate(); drawCart();};
  const task = async fn => {if (busy || unresolved) return; const unlock = lock(); try {await fn();} catch (error) {if (valid()) feedback.textContent = error.message;} finally {unlock(); if (valid() && !prepared) form.elements.directCode.focus();}};
  form.querySelector('#directReadCode').onclick = () => task(async () => {
    const value = form.elements.directCode.value.trim(); if (!value) throw Error('Leia ou digite o código.');
    const found = await foundationRequest('/api/commercial/products/lookup?code=' + encodeURIComponent(value)); if (!valid()) return;
    if (!found.product?.id) throw Error('Código não encontrado.'); const factor = found.packageUnits || 1; add(found.product, factor); form.elements.directCode.value = ''; form.elements.directCode.focus();
  });
  form.elements.directCode.onkeydown = event => {if (event.key === 'Enter') {event.preventDefault(); if (!event.repeat && !event.isComposing) form.querySelector('#directReadCode').click();}};
  form.querySelector('#directSearchProducts').onclick = () => task(async () => {
    const generation = ++searchGeneration, data = await foundationRequest('/api/commercial/products?q=' + encodeURIComponent(form.elements.directProductSearch.value.trim()) + '&pageSize=50'); if (!valid() || generation !== searchGeneration) return;
    productsFound = data.items; form.elements.directProduct.innerHTML = '<option value="">Escolha um produto</option>' + productsFound.map(product => '<option value="' + esc(product.id) + '">' + esc(product.name + (product.active === false ? ' · DESATIVADO' : '')) + '</option>').join('');
    feedback.textContent = data.total > productsFound.length ? 'Mostrando os primeiros 50 resultados. Refine a busca ou use o código exato.' : ''; form.elements.directProduct.focus();
  });
  form.querySelector('#directAdd').onclick = () => {if (busy || unresolved) return; try {const product = productsFound.find(product => product.id === form.elements.directProduct.value); if (!product) throw Error('Escolha um produto encontrado.'); add(product, Number(form.elements.directQuantity.value));} catch (error) {feedback.textContent = error.message;}};
  form.querySelector('#directSearchCustomers').onclick = () => task(async () => {
    const data = await foundationRequest('/api/commercial/customers?q=' + encodeURIComponent(form.elements.directCustomerSearch.value.trim()) + '&status=active&pageSize=50'); if (!valid()) return;
    const previous = form.elements.directCustomer.value; form.elements.directCustomer.innerHTML = '<option value="">Consumidor final</option>' + data.items.map(customer => '<option value="' + esc(customer.id) + '">' + esc(customer.name) + '</option>').join(''); form.elements.directCustomer.value = data.items.some(customer => customer.id === previous) ? previous : ''; invalidate();
  });
  for (const input of form.querySelectorAll('#directCustomer,#directMethod,#directStatus,#directDueDate,#directDiscount,#directDiscountReason,#directOfferReason')) input.oninput = () => {form.elements.directDueDate.disabled = form.elements.directStatus.value !== 'pending'; invalidate();};
  const build = cashSessionId => ({requestId, customerId:form.elements.directCustomer.value, paymentMethod:form.elements.directMethod.value, paymentStatus:form.elements.directStatus.value, dueDate:form.elements.directStatus.value === 'pending' ? form.elements.directDueDate.value : '', discount:form.elements.directDiscount.value || '0', discountReason:form.elements.directDiscountReason.value, offerReason:form.elements.directOfferReason.value, expectedCashSessionId:cashSessionId, items:lines.map(line => ({productId:line.product.id,quantity:line.quantity}))});
  const confirm = async () => {
    if (busy || !prepared) return; const unlock = lock();
    try {
      const response = await foundationRequest('/api/commercial/sales', {...prepared, ...(approval ? {approvalToken:approval.approvalToken} : {})}); if (!valid()) return;
      prepared = null; approval = null; unresolved = false;
      const details = '<p>Venda confirmada: ' + esc(response.sale.id) + '</p><p>Total comercial: ' + commercialMoney(response.sale.totalCents) + '</p><p>' + esc(experienceApprovalText(response.sale)) + '</p>';
      dialog.close(); dialog.remove(); if (refresh) await refresh(); else if (!foundationRestricted) {state = await api('/api/state'); render();} showInfo('Venda registrada', details);
    } catch (error) {
      if (!valid()) return;
      const ambiguous = error.status === undefined; unresolved = ambiguous;
      if (!ambiguous) {approval = null; prepared = null; review.innerHTML = '';}
      feedback.textContent = ambiguous ? 'A confirmação ficou sem resposta. Mantenha esta janela e use Confirmar venda novamente para consultar/repetir a mesma identificação, sem alterar os dados. Não inicie outra venda equivalente.' : error.message + ' Revise novamente antes de confirmar.';
    } finally {
      unlock();
      if (valid()) {
        if (unresolved) form.querySelectorAll('input,select,#directClose,#directPrepare,#directAdd,#directReadCode,#directSearchProducts,#directSearchCustomers,[data-direct-remove]').forEach(element => element.disabled = true);
        else if (!prepared) {form.querySelectorAll('input,select,button').forEach(element => element.disabled = false); form.elements.directDueDate.disabled = form.elements.directStatus.value !== 'pending';}
      }
    }
  };
  const authorize = async () => {
    if (busy || !prepared || unresolved) return;
    const login = form.querySelector('#directApproverLogin'), password = form.querySelector('#directApproverPassword'), reason = form.querySelector('#directApprovalReason');
    const input = {saleDraft:prepared, approverLogin:login.value, approverPassword:password.value, reason:reason.value}; password.value = '';
    const unlock = lock();
    try {const pending = foundationRequest('/api/commercial/sales/inactive-approval', input); input.approverPassword = ''; const grant = await pending; if (!valid()) return; approval = grant; review.querySelector('#directAuthorize').hidden = true; review.querySelector('#directConfirm').hidden = false; review.querySelector('#directApprovalStatus').textContent = 'Liberação obtida até ' + commercialDate(grant.expiresAt) + '. Confirme esta mesma venda.';}
    catch (error) {if (valid()) feedback.textContent = error.message;}
    finally {input.approverPassword = ''; unlock();}
  };
  form.onsubmit = event => {event.preventDefault(); task(async () => {
    if (!lines.length) throw Error('Adicione um produto.');
    const checkout = await foundationRequest('/api/commercial/sales/checkout-context'); if (!valid()) return;
    const draft = build(checkout.cashSessionId), result = await foundationRequest('/api/commercial/sales/preview', draft); if (!valid()) return;
    const inactiveIds = new Set(result.inactiveProductIds || []);
    lines.forEach(line => line.product = {...line.product, active:!inactiveIds.has(line.product.id)}); drawCart();
    prepared = {...draft, expectedOffer:result.expectedOffer, items:draft.items.map(item => ({...item, priceCents:result.offer.items.find(offered => offered.productId === item.productId).priceCents}))}; approval = null;
    form.querySelector('#directCash').textContent = checkout.cashSessionId ? 'Há Caixa aberto. Recebimento declarado será vinculado quando aplicável.' : 'Sem Caixa aberto; nenhum saldo de caixa é consultado nesta tela.';
    const inactive = inactiveIds.size > 0;
    review.innerHTML = '<h3>Revisão de preços atuais</h3>' + table(['Produto', 'Quantidade', 'Preço atual'], result.offer.items.map(item => '<tr><td>' + esc(item.name) + '</td><td>' + item.quantity + '</td><td>' + money(item.priceCents) + '</td></tr>')) + '<p><strong>Total comercial: ' + money(result.totalCents) + '</strong></p>' +
      (inactive ? '<p class="cancelled">Há produto desativado. O cadastro permanecerá desativado após a venda.</p>' + field('Login de quem libera', 'directApproverLogin', 'text', 'required autocomplete="off"') + field('Senha de quem libera', 'directApproverPassword', 'password', 'required autocomplete="off"') + field('Motivo obrigatório da liberação', 'directApprovalReason', 'text', 'required maxlength="500"') + '<p id="directApprovalStatus" role="status"></p><button type="button" id="directAuthorize">Confirmar identidade e liberar</button>' : '') + '<button type="button" id="directConfirm" ' + (inactive ? 'hidden' : '') + '>Confirmar venda</button>';
    review.querySelector('#directConfirm').onclick = confirm;
    if (inactive) {review.querySelector('#directAuthorize').onclick = authorize; review.querySelectorAll('input').forEach(input => input.oninput = () => {approval = null; review.querySelector('#directAuthorize').hidden = false; review.querySelector('#directConfirm').hidden = true; review.querySelector('#directApprovalStatus').textContent = '';});}
  });};
  form.querySelector('#directClose').onclick = () => {if (!busy && !unresolved) dialog.close();};
  dialog.oncancel = event => {if (busy || unresolved) event.preventDefault();};
  dialog.addEventListener('close', () => {prepared = null; approval = null; dialog.remove(); experienceRestoreFocus(opener);}, {once:true}); drawCart(); form.elements.directCode.focus();
}
