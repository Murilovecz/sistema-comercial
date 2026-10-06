/* Acesso pessoal e recuperação: credenciais apenas no formulário transitório. */
function accessDialog(title,body) {
  document.querySelector('#accessDialog')?.remove();
  const dialog=document.createElement('dialog');dialog.id='accessDialog';dialog.style.maxWidth='780px';
  dialog.innerHTML='<h2 id="accessTitle">'+esc(title)+'</h2>'+body+'<div class="actions spaced"><button type="button" class="secondary" data-access-close>Fechar</button></div>';
  dialog.setAttribute('aria-labelledby','accessTitle');document.body.append(dialog);
  dialog.querySelector('[data-access-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialog.querySelectorAll('input').forEach(input=>input.value='');dialog.remove();},{once:true});
  dialog.showModal();dialog.querySelector('input,button')?.focus();return dialog;
}
function accessChangePassword() {
  foundationModal('Trocar minha senha',field('Senha atual','currentPassword','password','required autocomplete="current-password"')+field('Nova senha','newPassword','password','required minlength="12" maxlength="128" autocomplete="new-password"')+field('Confirme a nova senha','confirmPassword','password','required minlength="12" maxlength="128" autocomplete="new-password"')+'<p class="muted">Use de 12 a 128 caracteres. Todas as suas sessões serão encerradas; entre novamente com a nova senha.</p>','Trocar senha',async form=>{
    try{await foundationRequest('/api/auth/password/change',{currentPassword:form.elements.currentPassword.value,newPassword:form.elements.newPassword.value,confirmPassword:form.elements.confirmPassword.value});location.reload();}
    finally{form.querySelectorAll('input').forEach(input=>input.value='');}
  });
}
async function accessSessions() {
  const dialog=accessDialog('Minhas sessões','<p class="muted">A origem local não identifica um dispositivo confiável. Revogações entram em vigor no servidor.</p><p data-access-feedback role="status">Carregando…</p><div data-access-sessions></div><div class="actions"><button type="button" data-access-refresh class="secondary">Atualizar</button><button type="button" data-access-others class="secondary">Encerrar todas as outras sessões</button></div>');
  const feedback=dialog.querySelector('[data-access-feedback]');
  const load=async()=>{try{const data=await foundationRequest('/api/auth/sessions');if(!dialog.isConnected)return;
    dialog.querySelector('[data-access-sessions]').innerHTML=table(['Sessão','Criação','Última atividade','Origem','Ação'],data.sessions.map(s=>'<tr><td>'+esc(s.current?'Sessão atual':'Outra sessão')+'</td><td>'+esc(commercialDate(s.createdAt))+'</td><td>'+esc(commercialDate(s.lastSeenAt))+'</td><td>'+esc(s.origin)+'</td><td><button type="button" class="secondary" data-access-revoke="'+esc(s.id)+'">'+(s.current?'Encerrar esta sessão':'Encerrar sessão')+'</button></td></tr>'));
    feedback.className='muted';feedback.textContent=data.sessions.length+' sessão(ões) ativa(s).';
    dialog.querySelectorAll('[data-access-revoke]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const result=await foundationRequest('/api/auth/sessions/revoke',{sessionId:button.dataset.accessRevoke});if(result.loggedOut)location.reload();else await load();}catch(error){feedback.className='error';feedback.textContent=error.message;button.disabled=false;}});
  }catch(error){if(dialog.isConnected){feedback.className='error';feedback.textContent=error.message;}}};
  dialog.querySelector('[data-access-refresh]').onclick=load;
  dialog.querySelector('[data-access-others]').onclick=async event=>{event.target.disabled=true;try{await foundationRequest('/api/auth/sessions/revoke-others',{});await load();}catch(error){feedback.className='error';feedback.textContent=error.message;}finally{event.target.disabled=false;}};
  await load();
}
function accessPersonal() {accessDialog('Minha conta','<p>'+esc(window.foundationContext?.user.name||'')+'</p><div class="actions"><button type="button" data-access-password>Trocar minha senha</button><button type="button" data-access-list class="secondary">Minhas sessões</button></div>');document.querySelector('[data-access-password]').onclick=()=>{document.querySelector('#accessDialog')?.close();accessChangePassword();};document.querySelector('[data-access-list]').onclick=()=>accessSessions();}
const accessAfterRenderOriginal=foundationAfterRender;
foundationAfterRender=function(){accessAfterRenderOriginal();if(!window.foundationContext)return;const top=document.querySelector('main > header.top');if(top&&!top.querySelector('[data-access-personal]')){const button=document.createElement('button');button.type='button';button.className='secondary';button.dataset.accessPersonal='true';button.textContent='Minha conta';button.onclick=accessPersonal;top.insertBefore(button,top.querySelector('#logout'));}};
const accessChooseOriginal=foundationChooseContext;
foundationChooseContext=function(...args){accessChooseOriginal(...args);const container=document.querySelector('.login');if(container&&window.foundationContext){const button=document.createElement('button');button.className='secondary spaced';button.textContent='Minha conta';button.onclick=accessPersonal;container.append(button);}};
function accessRecovery() {
  foundationModal('Criar nova senha com código de recuperação',field('Login','login','text','required autocomplete="username"')+field('Código recebido do administrador','resetCode','password','required autocomplete="off"')+field('Nova senha','newPassword','password','required minlength="12" maxlength="128" autocomplete="new-password"')+field('Confirme a nova senha','confirmPassword','password','required minlength="12" maxlength="128" autocomplete="new-password"')+'<p class="muted">O código tem validade limitada e só pode ser usado uma vez. Peça a um administrador autorizado caso ainda não tenha um código.</p>','Criar nova senha',async form=>{
    try{await foundationRequest('/api/auth/password/reset',{login:form.elements.login.value,resetCode:form.elements.resetCode.value,newPassword:form.elements.newPassword.value,confirmPassword:form.elements.confirmPassword.value});location.reload();}
    finally{form.querySelectorAll('input[type=password]').forEach(input=>input.value='');}
  });
}
const accessAuthOriginal=foundationAuthScreen;
foundationAuthScreen=function(needsSetup,...args){accessAuthOriginal(needsSetup,...args);if(needsSetup)return;const button=document.createElement('button');button.type='button';button.className='secondary spaced';button.textContent='Tenho um código de recuperação';button.onclick=accessRecovery;document.querySelector('.login')?.append(button);};
function accessAdminReset(id,name) {
  const context=window.foundationContext,scope=context&&[context.user.id,context.sessionId,context.companyId,context.unitId];
  const sameContext=()=>{const current=window.foundationContext;return Boolean(current&&scope&&[current.user.id,current.sessionId,current.companyId,current.unitId].every((value,index)=>value===scope[index]));};
  foundationModal('Redefinir acesso de '+name,field('Sua senha de administrador','operatorPassword','password','required autocomplete="current-password"')+field('Motivo','reason','text','required maxlength="500"')+'<p class="muted">O acesso atual será invalidado e as sessões encerradas. Um código temporário permitirá ao usuário criar sua nova senha. Contas compartilhadas entre empresas exigem procedimento próprio.</p>','Gerar código de recuperação',async form=>{
    let result;try{result=await foundationRequest('/api/foundation/password-reset',{id,operatorPassword:form.elements.operatorPassword.value,reason:form.elements.reason.value});}finally{form.elements.operatorPassword.value='';}
    if(!form.isConnected||!sameContext())return;
    // Render only after the submitting dialog closes; never save the code locally.
    setTimeout(()=>{if(sameContext())accessDialog('Código de recuperação gerado','<p>Entregue este código de forma privada ao usuário. Ele será mostrado apenas agora.</p><p><strong>Validade: '+esc(commercialDate(result.expiresAt))+'</strong></p><label>Código temporário<input readonly autocomplete="off" value="'+esc(result.resetCode)+'"></label><p class="muted">Ao fechar, o código será removido desta tela.</p>');},0);
  });
}
const accessAdminOriginal=foundationAdmin;
foundationAdmin=async function(...args){await accessAdminOriginal(...args);if(!foundationHas('users.reset_password'))return;document.querySelectorAll('[data-foundation-access]').forEach(button=>{if(button.dataset.foundationAccess===window.foundationContext.user.id)return;const reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='Redefinir senha';reset.onclick=()=>accessAdminReset(button.dataset.foundationAccess,button.closest('tr').cells[0].textContent);button.after(reset);});};
extraPageHandlers.foundationAdmin=foundationAdmin;

// A mesma consulta proporcional atende perfis completos e parciais.
extraPageTitles.foundationSalesList=['Vendas registradas','Consulte vendas e responsáveis da unidade selecionada.'];
extraPageHandlers.foundationSalesList=()=>commercialReadPage(commercialReadPages.find(entry=>entry.key==='sales'));
navigationGroups.find(group=>group.id==='commercial').pages.splice(1,0,'foundationSalesList');
const accessRecordActionsOriginal=commercialRecordActions;
commercialRecordActions=function(entry,row){return accessRecordActionsOriginal(entry,row)+(entry.key==='sales'?' <button type="button" class="secondary" data-sale-detail="'+esc(row.id)+'">Ver detalhes</button>':'');};
const accessBindActionsOriginal=commercialBindRowActions;
commercialBindRowActions=function(...args){accessBindActionsOriginal(...args);document.querySelectorAll('[data-sale-detail]').forEach(button=>button.onclick=()=>accessSaleDetail(button.dataset.saleDetail));};
async function accessSaleDetail(id) {
  const context=commercialContextKey();
  try {
    const response=await foundationRequest('/api/commercial/sales/by-id?id='+encodeURIComponent(id));
    if(context!==commercialContextKey())return;
    const sale=response.sale;
    accessDialog('Detalhes da venda','<p><strong>Identificador: </strong>'+esc(sale.id)+'</p><p>'+esc(commercialDate(sale.date))+' · '+esc(sale.customerName||'Consumidor final')+' · '+(sale.cancelledAt?'Cancelada':'Registrada')+'</p>'+table(['Produto vendido','Quantidade','Preço unitário','Liberação'],sale.items.map(item=>'<tr><td>'+esc(item.name||item.productId)+'</td><td>'+esc(item.quantity)+'</td><td>'+commercialMoney(item.priceCents)+'</td><td>'+esc(item.inactiveAtSale?'Produto desativado vendido com liberação':'—')+'</td></tr>'))+'<p><strong>Total comercial: '+commercialMoney(sale.totalCents)+'</strong> · Desconto: '+commercialMoney(sale.discountCents)+'</p><p>'+esc(experienceApprovalText(sale))+'</p>'+(sale.customerId?'<p>Identificador do cliente: '+esc(sale.customerId)+'</p>':'')+'<p class="muted">Este detalhe mostra a venda comercial. Recebimentos, contas e caixa exigem consulta financeira própria.</p>');
  } catch(error) {if(context===commercialContextKey())notice(error.message);}
}
