function catalogFilter(){return '<div class="field"><label for="catalogStatus">Situação do cadastro</label><select id="catalogStatus"><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select></div>';}
function catalogMatches(r){const status=document.querySelector('#catalogStatus').value;return status==='all'||(status==='active'?isActive(r):!isActive(r));}
function activeButton(r,kind){return `<button class="secondary" data-active="${r.id}" data-kind="${kind}">${isActive(r)?'Desativar':'Reativar'}</button>`;}
function bindActive(draw){document.querySelectorAll('[data-active]').forEach(b=>b.onclick=()=>{
 const r=state[b.dataset.kind].find(r=>r.id===b.dataset.active),active=!isActive(r);
 openActionDialog((active?'Reativar: ':'Desativar: ')+r.name,'<p>'+ (active?'O cadastro voltará a aparecer em novas vendas e orçamentos.':'O cadastro ficará indisponível para novas vendas e orçamentos. Históricos e movimentações serão preservados.')+'</p>',active?'Confirmar reativação':'Confirmar desativação',async()=>{state=await api('/api/'+b.dataset.kind+'/active',{id:r.id,active,expectedVersion:r.version||0,responsible:scopedSessionStorage.getItem('demoUser')});draw();notice('Situação do cadastro atualizada.');});
});}
function bindProductSearch(){
 const search=document.querySelector('#productSearch'),select=document.querySelector('#product');
 const draw=()=>{const previous=select.value,rows=state.products.filter(p=>isActive(p)&&normalize(p.name+' '+(p.code||'')).includes(normalize(search.value)));
 select.innerHTML='<option value="">Selecione um produto</option>'+rows.map(p=>`<option value="${p.id}" ${(p.availableStock??p.stock)===0?'disabled':''}>${esc(p.code?p.code+' · ':'')}${esc(p.name)} · ${money(p.priceCents)} · ${p.availableStock??p.stock} livre(s).</option>`).join('');
 if(rows.some(p=>p.id===previous&&(p.availableStock??p.stock)>0))select.value=previous;else if(search.value&&rows.filter(p=>(p.availableStock??p.stock)>0).length===1)select.value=rows.find(p=>(p.availableStock??p.stock)>0).id;
 document.querySelector('#productMatches').textContent=rows.length?rows.length+' produto(s) encontrado(s).':'Nenhum produto ativo encontrado.';};
 search.oninput=draw;search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const matches=state.products.filter(p=>isActive(p)&&(p.availableStock??p.stock)>0&&normalize(p.name+' '+(p.code||'')).includes(normalize(search.value)));if(matches.length===1&&select.value)document.querySelector('#add').requestSubmit();else select.focus();}};draw();
}
