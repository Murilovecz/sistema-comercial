'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./http-fixture');
test('V1.1 a página inicial serve todos os seus scripts, incluindo as janelas rápidas na ordem correta',async t=>{
 const f=await fixture(t),page=await fetch(f.owner.origin+'/'),html=await page.text();assert.equal(page.status,200);
 const sources=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match=>match[1]);
 assert.ok(sources.indexOf('/commercial-ui.js')<sources.indexOf('/foundation-experience.js'));assert.ok(sources.indexOf('/foundation-experience.js')<sources.indexOf('/startup.js'));
 for(const src of sources){const response=await fetch(f.owner.origin+src);assert.equal(response.status,200,src);assert.match(response.headers.get('content-type'),/javascript/,src);assert.ok((await response.text()).length>0,src);}
});
