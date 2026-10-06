'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('IDP-001 UI: retry da revisão preserva identidade e vínculo de Caixa da intenção original',async()=>{
 let confirmation;const requests=[];
 const state={products:[{id:'p',name:'Produto',priceCents:1000,stock:3}],customers:[],sales:[],cashId:'cash-original'};
 const sandbox={state,document:{querySelector:()=>null},unknownDraft:false,cart:[{productId:'p',quantity:1}],saleRequestId:null,crypto:{randomUUID:()=> 'stable-intent'},scopedLocalStorage:{setItem(){}},notice(){},render(){},isActive:()=>true,openCash:s=>({id:s.cashId}),discountTotals:()=>({totalCents:1000}),table:()=>'',esc:v=>v,money:v=>String(v),commercialBlock:()=>'',paymentLabels:{cash:'Dinheiro'},paymentStatuses:{received:'Recebido'},api:async(url,body)=>{if(!body)return state;requests.push(structuredClone(body));throw Error('Timeout sintético; resultado desconhecido');}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/store.js'),'utf8'),sandbox);
 vm.runInContext("saleDraft={customerId:'',paymentMethod:'cash',paymentStatus:'received',discount:'0',discountReason:''}",sandbox);
 sandbox.openActionDialog=(title,body,label,action)=>{confirmation=action;};
 await sandbox.reviewSale();assert.equal(typeof confirmation,'function');
 await assert.rejects(confirmation,/Timeout sintético/);state.cashId='cash-after-reconnect';
 await assert.rejects(confirmation,/Timeout sintético/);assert.equal(requests.length,2);assert.equal(requests[0].requestId,'stable-intent');assert.equal(requests[0].expectedCashSessionId,'cash-original');assert.deepEqual(requests[1],requests[0]);assert.equal(sandbox.saleRequestId,'stable-intent');
});
