function cashSummary(session){
 const totals={cash:0,pix:0,debit:0,credit:0,other:0},items=session.movements||[];
 let entriesCents=0,exitsCents=0;
 for(const m of items){
  if(['receipt','supplierRefund'].includes(m.type))totals[m.paymentMethod]=(totals[m.paymentMethod]||0)+m.amountCents;
  if(m.paymentMethod!=='cash')continue;
  if(['receipt','supply','supplierRefund'].includes(m.type))entriesCents+=m.amountCents;
  else exitsCents+=m.amountCents;
 }
 const expectedCents=session.openingCents+entriesCents-exitsCents;if(![expectedCents,entriesCents,exitsCents,...Object.values(totals)].every(Number.isSafeInteger))throw Error('Total do Caixa fora do limite permitido.');return {openingCents:session.openingCents,entriesCents,exitsCents,expectedCents,totals};
}
function openCash(state){return (state.cashSessions||[]).find(c=>!c.closedAt)||null;}
if(typeof module!=='undefined')module.exports={cashSummary,openCash};
