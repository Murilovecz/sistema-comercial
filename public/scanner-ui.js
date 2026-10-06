function scannerField(id,label,button){return `<form id="${id}Form" novalidate class="scanner-box"><div class="row">${field(label,id,'text','maxlength="64" autocomplete="off" spellcheck="false" placeholder="Leia ou digite o código e pressione Enter"')}<div class="field"><button>${button}</button></div></div><p class="muted">Leitor em modo teclado com Enter. Sem leitor, digite o código ou use a busca por nome. Cada leitura na venda adiciona 1 unidade.</p><p id="${id}Feedback" role="status" aria-live="polite"></p></form>`;}
function lookupMessage(result){return result.status==='ambiguous'?'Mais de um produto usa este código. Confira os cadastros antes de continuar.':'Código não encontrado. Confira o código de barras ou interno cadastrado.';}
function bindSaleScanner(){
 const form=document.querySelector('#saleScanForm'),input=form.elements.saleScan,feedback=document.querySelector('#saleScanFeedback');let queue=Promise.resolve();
 input.oninput=()=>{feedback.textContent='';feedback.className='';};
 input.onkeydown=e=>{if(e.key==='Enter'&&(e.repeat||e.isComposing))e.preventDefault();};
 form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(!value)return;input.value='';
  queue=queue.then(async()=>{if(!input.isConnected)return;try{
   const latest=await api('/api/state');if(!input.isConnected)return;
   const result=lookupProduct(latest.products,value);if(result.status!=='found')throw Error(lookupMessage(result));
   const next=addProductToCart(latest.products,cart,result.product.id,1);state=latest;cart=next;saleRequestId=null;drawCart();saveDraft();
   feedback.className='';feedback.textContent=result.product.name+' adicionado. Quantidade no carrinho: '+cart.find(i=>i.productId===result.product.id).quantity+'.';
  }catch(error){if(input.isConnected){feedback.className='error';feedback.textContent=error.message;if(!input.value){input.value=value;input.select();}}}
  });input.focus();
 };input.focus();
}
function productLookup(){
 document.querySelector('#content').innerHTML='<section class="panel"><h2>Consultar preço e estoque</h2>'+scannerField('lookupScan','Código de barras ou interno','Consultar')+field('Pesquisar produto pelo nome','lookupName','search','placeholder="Digite parte do nome"')+'<p class="muted">A consulta mostra o estoque disponível e não reserva mercadorias. Use Adicionar à venda para iniciar ou continuar o carrinho.</p><div id="lookupResults"></div></section>';
 const form=document.querySelector('#lookupScanForm'),input=form.elements.lookupScan,name=document.querySelector('#lookupName'),feedback=document.querySelector('#lookupScanFeedback');let queue=Promise.resolve(),generation=0;
 input.oninput=()=>{feedback.textContent='';feedback.className='';};
 const draw=rows=>{
  document.querySelector('#lookupResults').innerHTML=table(['Produto','Códigos','Preço','Estoque','Ações'],rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong><br><span class="${isActive(p)?'pill':'cancelled'}">${isActive(p)?'Ativo':'Inativo'}</span></td><td>Interno: ${esc(p.code||'—')}<br>Barras: ${esc(p.barcode||'—')}</td><td>${money(p.priceCents)}</td><td>${p.stock} vendável<br>${retainedQuantity(state,p.id)} retido<br>${physicalPosition(state,p).total} físico total<br>${p.reservedStock||0} reservado<br>${p.availableStock??p.stock} livre(s)</td><td><button class="secondary" data-lookup-add="${p.id}" ${!isActive(p)||(p.availableStock??p.stock)<1?'disabled':''}>Adicionar à venda</button> <button class="secondary" data-entity-kind="products" data-entity-id="${p.id}">Ver cadastro e reservas</button></td></tr>`),'Nenhum produto encontrado.');
  bindEntityLinks();document.querySelectorAll('[data-lookup-add]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const latest=await api('/api/state');if(!b.isConnected)return;const next=addProductToCart(latest.products,cart,b.dataset.lookupAdd,1);state=latest;cart=next;saleRequestId=null;saveDraft();page='sales';render();notice('Produto adicionado à venda.');}catch(e){if(b.isConnected){feedback.className='error';feedback.textContent=e.message;b.disabled=false;}}});
 };
 name.oninput=()=>{generation++;feedback.textContent='';draw(state.products.filter(p=>normalize(p.name).includes(normalize(name.value))));};
 input.onkeydown=e=>{if(e.key==='Enter'&&(e.repeat||e.isComposing))e.preventDefault();};
 form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(!value)return;input.value='';const current=++generation;
  queue=queue.then(async()=>{try{const latest=await api('/api/state');if(!input.isConnected||current!==generation)return;state=latest;name.value='';const result=lookupProduct(state.products,value);feedback.className=result.status==='found'?'':'error';feedback.textContent=result.status==='found'?'Produto encontrado: '+result.product.name+'.':lookupMessage(result);draw(result.status==='found'?[result.product]:[]);}catch(e){if(input.isConnected&&current===generation){feedback.className='error';feedback.textContent=e.message;}}});input.focus();
 };draw(state.products);input.focus();
}
