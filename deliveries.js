const A=require('./advanced-common'),{randomUUID}=require('node:crypto'),{calendarDay}=require('./public/reports'),{deliveryPosition}=require('./public/delivery-core');
const methods=['local','pickup','other'];
function deliveryAction(state,action,input){return A.run(state,'deliveries',action,input,(next,date)=>{
 let r=action==='create'?null:A.record(next,'deliveries',input.id);if(r)A.expected(r,input);
 if(action==='create'){
  const s=A.record(next,'sales',input.saleId);if(s.cancelledAt)throw Error('Venda cancelada não recebe ordem de entrega.');if(next.deliveries.some(d=>d.saleId===s.id))throw Error('A venda já possui ordem de entrega.');if(!methods.includes(input.method))throw Error('Escolha o meio de entrega.');
  r=A.baseRecord(next,'deliveries',date,input,{saleId:s.id,customerId:s.customerId,customerName:s.customerName,recipient:A.text(input.recipient,120,'Destinatário'),address:A.text(input.address,500,'Endereço'),contact:A.text(input.contact,150,'Contato'),method:input.method,expectedDate:A.dateOnly(input.expectedDate,'Previsão'),window:A.text(input.window,120,'Janela'),instructions:A.text(input.instructions,1000,'Instruções'),items:s.items.map(i=>({productId:i.productId,name:i.name,quantity:i.quantity,pickedQuantity:0})),shipments:[],deliveries:[],attempts:[],logisticReturns:[]});next.deliveries.push(r);return;
 }
 const s=A.record(next,'sales',r.saleId),positions=()=>deliveryPosition(next,r),why=()=>A.reason(input),realDay=()=>{const d=A.dateOnly(input.declaredDate,'Data efetiva',true);if(d>calendarDay())throw Error('Data efetiva não pode ser futura.');return d;};
 if(action==='pick'){
  if(s.cancelledAt)throw Error('Venda cancelada não pode ser separada.');for(const i of A.items(input.items)){const p=positions().find(p=>p.productId===i.productId),qty=A.integer(i.quantity,'Quantidade conferida',0);if(!p||qty>p.target||qty<p.dispatched)throw Error('Conferência acima do vendido não devolvido ou abaixo do expedido.');r.items.find(p=>p.productId===i.productId).pickedQuantity=qty;}r.pickingCompletedAt=null;
 }else if(action==='finish'){
  if(s.cancelledAt||positions().some(p=>p.conflict||p.picked!==p.target))throw Error('Confira todos os faltantes e saldos antes de concluir a separação.');r.pickingCompletedAt=date;
 }else if(action==='ship'){
  if(s.cancelledAt||positions().some(p=>p.conflict))throw Error('Venda cancelada ou devolvida exige revisão logística antes de expedir.');const items=A.items(input.items).map(i=>{const p=positions().find(p=>p.productId===i.productId),qty=A.integer(i.quantity,'Quantidade expedida');if(!p||qty>p.toShip)throw Error('Expedição acima da quantidade separada disponível.');return {productId:i.productId,quantity:qty};});r.shipments.push({id:randomUUID(),date,declaredDate:realDay(),responsible:A.text(input.responsible,120,'Responsável',true),reference:A.text(input.reference,150,'Referência'),items});
 }else if(action==='deliver'||action==='return'){
  const items=A.items(input.items).map(i=>{const p=positions().find(p=>p.productId===i.productId),qty=A.integer(i.quantity,'Quantidade');if(!p||qty>p.transit)throw Error('Quantidade acima das unidades em trânsito.');return {productId:i.productId,quantity:qty};});const entry={id:randomUUID(),date,declaredDate:realDay(),items};if(action==='deliver'){entry.recipient=A.text(input.recipient,120,'Recebedor',true);r.deliveries.push(entry);}else{entry.reason=why();r.logisticReturns.push(entry);r.pickingCompletedAt=null;}
 }else if(action==='attempt'){
  if(!positions().some(p=>p.transit))throw Error('Não há unidades em trânsito.');r.attempts.push({id:randomUUID(),date,declaredDate:realDay(),reason:why()});
 }else if(action==='reschedule'){
  const previous={expectedDate:r.expectedDate,window:r.window};r.expectedDate=A.dateOnly(input.expectedDate,'Previsão');r.window=A.text(input.window,120,'Janela');A.touch(r,date,action,input,{reason:why(),previous});return;
 }else if(action==='instructions'){
  const previous=r.instructions;r.instructions=A.text(input.instructions,1000,'Instruções');A.touch(r,date,action,input,{reason:why(),previous});return;
 }else if(action==='reconcile'){
  const before=positions(),changes=[];for(const p of before){const excess=Math.max(0,p.dispatched-p.target),declared=A.integer(input.items?.find(i=>i.productId===p.productId)?.quantity??0,'Quantidade entregue devolvida',0);if(declared>excess||declared>p.delivered)throw Error('Reconciliação acima das unidades entregues e devolvidas comercialmente.');if(excess>declared)throw Error('Há expedição acima do saldo comercial. Declare retorno logístico das unidades em trânsito ou vincule devolução das já entregues.');if(declared)changes.push({productId:p.productId,quantity:declared});}if(changes.length){r.commercialReconciliations||=[];r.commercialReconciliations.push({id:randomUUID(),date,items:changes,reason:why(),returnIds:(s.returns||[]).map(x=>x.id),cancelledAt:s.cancelledAt||null});}for(const i of r.items)i.pickedQuantity=Math.min(i.pickedQuantity,before.find(p=>p.productId===i.productId).target);r.pickingCompletedAt=null;A.touch(r,date,action,input,{reason:why(),before});return;
 }else throw Error('Ação logística inválida.');A.touch(r,date,action,input);
});}
module.exports={deliveryAction};
