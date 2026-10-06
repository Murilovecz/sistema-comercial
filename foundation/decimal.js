'use strict';
// Exact decimal strings are a persistence contract, not permission to sell fractions.
// BigInt arithmetic never passes through IEEE-754 for quantity operations.
function decimal(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw Error('Quantidade numérica deve ser um inteiro seguro; decimais usam texto.');
    value = String(value);
  }
  if (typeof value !== 'string' || value.length > 150 || !/^-?\d+(?:\.\d+)?$/.test(value)) throw Error('Quantidade decimal inválida.');
  const negative=value.startsWith('-'), [whole,fraction='']=value.replace(/^-/, '').split('.');
  const integer=whole.replace(/^0+(?=\d)/,''), tail=fraction.replace(/0+$/,'');
  const result=integer+(tail?'.'+tail:'');
  return negative && result !== '0' ? '-'+result : result;
}
function parts(value) { const d=decimal(value), [integer,fraction='']=d.split('.'); return {coefficient:BigInt(integer+fraction),scale:fraction.length}; }
function format(coefficient,scale) {
  const negative=coefficient<0n, digits=(negative?-coefficient:coefficient).toString().padStart(scale+1,'0');
  return decimal((negative?'-':'')+(scale?digits.slice(0,-scale)+'.'+digits.slice(-scale):digits));
}
function add(a,b) { a=parts(a);b=parts(b);const scale=Math.max(a.scale,b.scale);return format(a.coefficient*10n**BigInt(scale-a.scale)+b.coefficient*10n**BigInt(scale-b.scale),scale); }
function compare(a,b) { a=parts(a);b=parts(b);const scale=Math.max(a.scale,b.scale),difference=a.coefficient*10n**BigInt(scale-a.scale)-b.coefficient*10n**BigInt(scale-b.scale);return difference<0n?-1:difference>0n?1:0; }
function legacyInteger(value) { const d=decimal(value);if(d.includes('.'))throw Error('Quantidade fracionada ainda não habilitada no domínio legado.');const n=Number(d);if(!Number.isSafeInteger(n))throw Error('Quantidade fora da precisão do domínio legado.');return n; }
module.exports={decimal,add,compare,legacyInteger};
