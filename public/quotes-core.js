const quoteCalendarDay=typeof module!=='undefined'?require('./reports').calendarDay:calendarDay;
function isActive(record){return !!record&&record.active!==false;}
function quoteStatus(q,today=quoteCalendarDay()){
 if(q.saleId)return 'converted';if(q.cancelledAt)return 'cancelled';
 return q.validUntil&&q.validUntil<today?'expired':'open';
}
const quoteLabels={open:'Aberto',expired:'Vencido',cancelled:'Cancelado',converted:'Convertido'};
if(typeof module!=='undefined')module.exports={isActive,quoteStatus,quoteLabels};
