'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {fixture}=require('./foundation/http-fixture');
const dist=path.join(__dirname,'frontend','dist');
// Build is an explicit prerequisite; these tests never run Vite or change dist.
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const assets=[...html.matchAll(/(?:src|href)="(\/ui\/assets\/[^\"]+)"/g)].map(match=>match[1]);
assert.ok(assets.some(url=>url.endsWith('.js'))&&assets.some(url=>url.endsWith('.css')),'Execute o build do frontend antes dos testes HTTP da SPA.');

function request(origin,url,method='GET',headers={}){
 return new Promise((resolve,reject)=>{
  // Native HTTP preserves encoded and literal traversal paths for negative tests.
  const req=http.request(origin,{path:url,method,headers},res=>{
   const chunks=[];res.on('data',chunk=>chunks.push(chunk));
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
  });req.on('error',reject);req.end();
 });
}
function rejected(response,status=404){
 assert.equal(response.status,status,response.body.toString());
 assert.match(response.headers['content-type'],/^application\/json/);
 assert.equal(response.headers['cache-control'],'no-store');
 assert.doesNotMatch(response.body.toString(),/<!doctype|id="root"|Projeto Sistema Local|node_modules|foundation\.sqlite/i);
}
function missing(){return Object.assign(new Error('Isolated missing build fixture'),{code:'ENOENT'});}

test('SPA HTTP: / mantém exatamente o HTML e os assets do legado',async t=>{
 const f=await fixture(t),response=await request(f.owner.origin,'/');
 assert.equal(response.status,200);assert.equal(response.body.toString(),fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8'));
 assert.match(response.body.toString(),/id="app"/);assert.doesNotMatch(response.body.toString(),/\/ui\/assets|id="root"/);
 assert.equal((await request(f.owner.origin,'/app.js')).status,200);
 assert.equal(response.headers['cache-control'],'no-store');
});
test('SPA HTTP: /ui/ entrega apenas o HTML construído, inclusive com query string',async t=>{
 const f=await fixture(t);
 for(const url of ['/ui/','/ui/?view=initial']){
  const response=await request(f.owner.origin,url);assert.equal(response.status,200);assert.equal(response.body.toString(),html);
  assert.match(response.headers['content-type'],/^text\/html; charset=utf-8$/);assert.equal(response.headers['cache-control'],'no-store');
  assert.equal(response.headers['x-content-type-options'],'nosniff');assert.equal(response.headers['x-frame-options'],'DENY');
  assert.doesNotMatch(response.body.toString(),/startup\.js|id="app"|csrfToken|foundation_session/);
 }
});
test('SPA HTTP: /ui redireciona para /ui/ sem aceitar destino fornecido pelo cliente',async t=>{
 const f=await fixture(t);
 for(const url of ['/ui','/ui?next=https://untrusted.example']){
  const response=await request(f.owner.origin,url);assert.equal(response.status,308);assert.equal(response.headers.location,'/ui/');assert.equal(response.headers['cache-control'],'no-store');
 }
});
test('SPA HTTP: JS e CSS reais do build têm bytes e Content-Type corretos',async t=>{
 const f=await fixture(t);
 for(const url of assets){
  const response=await request(f.owner.origin,url+'?version=ignored');assert.equal(response.status,200,url);
  assert.deepEqual(response.body,fs.readFileSync(path.join(dist,url.slice('/ui/'.length))));
  assert.equal(response.headers['content-type'],url.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
  assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.headers['x-content-type-options'],'nosniff');
 }
});
test('SPA HTTP: assets ausentes e deep links desconhecidos nunca recebem index.html',async t=>{
 const f=await fixture(t);
 for(const url of ['/ui/assets/arquivo-que-nao-existe.js','/ui/assets/','/ui/rota-inexistente','/ui/produtos','/ui/api/health','/ui/assets/missing.html'])rejected(await request(f.owner.origin,url));
});
test('SPA HTTP: health e identidade continuam pertencendo à API',async t=>{
 const f=await fixture(t),health=await request(f.owner.origin,'/api/health');
 assert.equal(health.status,200);assert.deepEqual(JSON.parse(health.body),{ready:true,local:true,version:require('./package.json').version});
 assert.equal(health.headers['cache-control'],'no-store');assert.match(health.headers['content-type'],/^application\/json/);
 rejected(await request(f.owner.origin,'/api/state'),401);
 assert.equal((await f.owner.call('/api/auth/me')).status,200);
});
test('SPA HTTP: arquivos privados, traversal e caminhos inválidos falham fechados',async t=>{
 const f=await fixture(t);
 const urls=['/ui/package.json','/ui/server.js','/ui/data/foundation.sqlite','/ui/node_modules/react/index.js','/ui/src/main.tsx','/ui/frontend/src/main.tsx','/ui/.git/config','/ui/.qa/report.md',
  '/ui/assets/../../../../server.js','/ui/../','/ui/../api/health','/ui/assets/%2e%2e/%2e%2e/package.json','/ui/assets/%2e%2e%2fpackage.json',
  '/ui/assets/..%5c..%5cserver.js','/ui/assets/%252e%252e%252fserver.js','/ui/assets/C:%5cWindows%5cwin.ini','/ui/assets/index.js::$DATA',
  '/ui/assets/%00.js','/ui/assets/%ZZ.js','/ui/assets//index.js','/ui/assets/.git/config','/ui/assets/../index.html'];
 for(const url of urls)rejected(await request(f.owner.origin,url));
});
test('SPA HTTP: métodos diferentes de GET não entregam entrada, redirect ou assets',async t=>{
 const f=await fixture(t);
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS','HEAD'])for(const url of ['/ui','/ui/',assets[0]]){
  const response=await request(f.owner.origin,url,method);rejected(response);if(method==='HEAD')assert.equal(response.body.length,0);
 }
});
test('SPA HTTP: dist ausente não impede legado ou API e /ui/ responde 503',async t=>{
 const realpath=fs.realpathSync;
 t.mock.method(fs,'realpathSync',function(filename,...args){if(path.resolve(String(filename))===dist)throw missing();return realpath.call(this,filename,...args);});
 const f=await fixture(t);rejected(await request(f.owner.origin,'/ui/'),503);
 assert.equal((await request(f.owner.origin,'/')).status,200);assert.equal((await request(f.owner.origin,'/api/health')).status,200);
});
test('SPA HTTP: index ausente retorna 503 controlado sem alterar o legado',async t=>{
 const read=fs.readFileSync;
 t.mock.method(fs,'readFileSync',function(filename,...args){if(path.resolve(String(filename))===path.join(dist,'index.html'))throw missing();return read.call(this,filename,...args);});
 const f=await fixture(t);rejected(await request(f.owner.origin,'/ui/'),503);
 assert.equal((await request(f.owner.origin,'/')).status,200);assert.equal((await request(f.owner.origin,'/api/health')).status,200);
});
test('SPA HTTP: destino real de asset fora de dist é rejeitado',async t=>{
 const f=await fixture(t),assetPath=path.join(dist,assets[0].slice('/ui/'.length)),realpath=fs.realpathSync;
 t.mock.method(fs,'realpathSync',function(filename,...args){if(path.resolve(String(filename))===assetPath)return path.join(__dirname,'server.js');return realpath.call(this,filename,...args);});
 rejected(await request(f.owner.origin,assets[0]));
});
test('SPA HTTP: validação de Host continua antes da entrega da SPA',async t=>{
 const f=await fixture(t);rejected(await request(f.owner.origin,'/ui/','GET',{Host:'untrusted.example'}),403);
});
