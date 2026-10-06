const {payableBalance,payableStatus,payableLabels}=require('./public/payables-core');
const {commercialSubtotal}=require('./public/discount-core');
const {purchaseStatus,purchaseSummary,purchaseLabels}=require('./public/purchases-core');
const {quoteStatus,quoteLabels}=require('./public/quotes-core');
const {paymentBalance}=require('./public/payments');
const {makeCsv,calendarDay}=require('./public/reports');
const paymentLabels={cash:'Dinheiro',pix:'Pix',debit:'Cartão de débito',credit:'Cartão de crédito',other:'Outro'};
const paymentStatuses={received:'Recebido',pending:'A receber',partial:'Parcialmente recebido'};
const money=value=>(value/100).toFixed(2).replace('.',',');
function exportCsv(state,kind,ids){
 if(!Array.isArray(ids)||ids.length>1000||ids.some(id=>typeof id!=='string'||id.length>80))throw Error('Selecione até 1.000 registros por exportação.');
 const definitions={
 payables:[['Conta','Fornecedor','Descrição','Referência','Situação','Total (R$)','Pago (R$)','Saldo (R$)','Saldo cancelado (R$)','Vencimentos','Compra','Observação'],p=>{const b=payableBalance(p);return ['PAG-'+String(p.number).padStart(5,'0'),p.supplierName,p.description,p.reference,payableLabels[payableStatus(p)],money(p.totalCents),money(b.paidCents),money(b.remainingCents),money(b.cancelledCents),p.installments.map(i=>i.dueDate||'Sem vencimento').join(' / '),p.purchaseNumber?'CMP-'+String(p.purchaseNumber).padStart(5,'0'):'',p.note];}],
 discounts:[['Data','Cliente','Subtotal (R$)','Desconto (R$)','Líquido (R$)','Motivo'],s=>[s.date,s.customerName,money(commercialSubtotal(s)),money(s.discountCents||0),money(s.totalCents),s.discountReason||'']],
 suppliers:[['Fornecedor','Telefone','E-mail','Observações','Cadastro'],s=>[s.name,s.phone||'',s.email||'',s.notes||'',s.active===false?'Inativo':'Ativo']],
 purchases:[['Pedido','Criação','Fornecedor','Situação','Previsão','Valor pedido (R$)','Valor recebido (R$)','Valor não entregue (R$)','Unidades pedidas','Unidades recebidas','Unidades não entregues','Observação','Motivo do encerramento'],p=>{const b=purchaseSummary(p);return ['CMP-'+String(p.number).padStart(5,'0'),p.date,p.supplierName,purchaseLabels[purchaseStatus(p)],p.expectedDate||'',money(p.totalCents),money(b.receivedCents),money(b.pendingCents),b.orderedQuantity,b.receivedQuantity,b.pendingQuantity,p.note||'',p.closeReason||''];}],
 quotes:[['Identificação','Data','Cliente','Situação','Validade','Total (R$)','Observação','Venda vinculada','Subtotal (R$)','Desconto (R$)','Motivo do desconto'],q=>['ORC-'+String(q.number).padStart(5,'0'),q.date,q.customerName,quoteLabels[quoteStatus(q)],q.validUntil||'',money(q.totalCents),q.note||'',q.saleId||'',money(commercialSubtotal(q)),money(q.discountCents||0),q.discountReason||'']],
  products:[['Produto','Código','Categoria','Preço de venda (R$)','Estoque','Estoque mínimo','Cadastro','Código de barras'],p=>[p.name,p.code||'',p.category||'',money(p.priceCents),p.stock,p.minStock||0,p.active===false?'Inativo':'Ativo',p.barcode||'']],
  customers:[['Nome','Telefone','E-mail','Observações','Cadastro'],c=>[c.name,c.phone||'',c.email||'',c.notes||'',c.active===false?'Inativo':'Ativo']],
  sales:[['Data da venda','Cliente','Total (R$)','Situação da venda','Forma de pagamento','Situação do pagamento','Vencimento','Recebido (R$)','Saldo a receber (R$)','Subtotal (R$)','Desconto (R$)','Motivo do desconto'],s=>[new Date(s.date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),s.customerName,money(s.totalCents),s.cancelledAt?'Cancelada':'Confirmada',paymentLabels[s.paymentMethod]||'Não informada',paymentStatuses[s.paymentStatus]||'Não informada',s.dueDate||'',paymentBalance(s).known?money(paymentBalance(s).receivedCents):'Não informado',paymentBalance(s).known?money(paymentBalance(s).remainingCents):'Não informado',money(commercialSubtotal(s)),money(s.discountCents||0),s.discountReason||'']],
  expenses:[['Data do pagamento','Descrição','Valor (R$)','Situação','Forma','Caixa','Observação'],e=>[e.paidDate,e.description,money(e.amountCents),e.cancelledAt?'Cancelada':'Registrada',paymentLabels[e.paymentMethod]||'Não informada',e.cashSessionId||'Sem vínculo',e.note||'']]
 };
 if(!Object.hasOwn(definitions,kind))throw Error('Lista inválida para exportação.');
 const [headers,row]=definitions[kind],selected=new Set(ids);
 return {body:makeCsv(headers,(state[kind==='discounts'?'sales':kind]||[]).filter(r=>selected.has(r.id)&&(kind!=='discounts'||!r.cancelledAt)).map(row)),filename:kind+'-'+calendarDay()+'.csv'};
}
module.exports={exportCsv};
