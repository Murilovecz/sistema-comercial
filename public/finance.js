const financeBalance=typeof module!=='undefined'?require('./payments').paymentBalance:paymentBalance;
function financialSummary(sales){return sales.filter(s=>!s.cancelledAt).reduce((summary,s)=>{const b=financeBalance(s);if(b.known){summary.receivedCents+=b.receivedCents;summary.pendingCents+=b.remainingCents;}else summary.unknownCount++;return summary;},{receivedCents:0,pendingCents:0,unknownCount:0});}
if(typeof module!=='undefined')module.exports={financialSummary};
