const reportReceipts=typeof module!=='undefined'?require('./payments').receiptList:receiptList;
const businessTimezone='America/Sao_Paulo';
function calendarDay(date=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:businessTimezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));}
function validDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>=1900&&Number(value.slice(0,4))<=2200&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
function inPeriod(value,start='',end='',dateOnly=false){const date=dateOnly?value:calendarDay(value);return (!start||date>=start)&&(!end||date<=end);}
function overdue(s,today=calendarDay()){return !s.cancelledAt&&['pending','partial'].includes(s.paymentStatus)&&validDay(s.dueDate)&&s.dueDate<today;}
function periodError(start,end){return (start&&!validDay(start))||(end&&!validDay(end))?'Informe datas válidas.':start&&end&&start>end?'A data inicial deve ser anterior ou igual à final.':'';}
function movementSummary(sales,expenses,start='',end='',supplierReturns=[]){
 let incomeCents=0,expenseCents=0,missingDates=0;const records=[];
 for(const s of sales)for(const r of reportReceipts(s)){if(!r.date||Number.isNaN(Date.parse(r.date))){missingDates++;continue;}if(inPeriod(r.date,start,end)){incomeCents+=r.amountCents;records.push({date:calendarDay(r.date),type:'Recebimento',description:s.customerName+(s.cancelledAt?' · venda cancelada':''),amountCents:r.amountCents});}}
 for(const s of sales)for(const r of s.refunds||[]){if(inPeriod(r.date,start,end)){expenseCents+=r.amountCents;records.push({date:calendarDay(r.date),type:'Devolução',description:s.customerName,amountCents:-r.amountCents});}}
 for(const e of expenses){if(inPeriod(e.paidDate,start,end,true)){expenseCents+=e.amountCents;records.push({date:e.paidDate,type:'Despesa',description:e.description+(e.cancelledAt?' · registro cancelado':''),amountCents:-e.amountCents});}}
 for(const supplierReturn of supplierReturns)for(const r of supplierReturn.refunds||[])if(inPeriod(r.paidDate,start,end,true)){incomeCents+=r.amountCents;records.push({date:r.paidDate,type:'Restituição de fornecedor',description:supplierReturn.supplierName,amountCents:r.amountCents});}
 if(![incomeCents,expenseCents,incomeCents-expenseCents].every(Number.isSafeInteger))throw Error('Total financeiro fora do limite permitido.');
 return {incomeCents,expenseCents,differenceCents:incomeCents-expenseCents,missingDates,records:records.sort((a,b)=>b.date.localeCompare(a.date))};
}
function csvCell(value){let text=String(value??'');if(typeof value==='string'&&/^\s*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
function makeCsv(headers,rows){return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');}
if(typeof module!=='undefined')module.exports={calendarDay,validDay,inPeriod,overdue,periodError,movementSummary,makeCsv};
