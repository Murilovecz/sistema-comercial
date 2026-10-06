'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {fixture}=require('./foundation/http-fixture');
const {createServer}=require('./server');
const builtHtml=fs.readFileSync(path.join(__dirname,'frontend/dist/index.html'),'utf8');
function environment(t,value){
 const previous=process.env.FRONTEND_DEV;
 if(value===undefined)delete process.env.FRONTEND_DEV;else process.env.FRONTEND_DEV=value;
 t.after(()=>{if(previous===undefined)delete process.env.FRONTEND_DEV;else process.env.FRONTEND_DEV=previous;});
}
async function page(f,url='/ui/',headers={}){
 const response=await fetch(f.owner.origin+url,{headers});return{status:response.status,headers:response.headers,text:await response.text()};
}
function devEntry(response){
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.match(response.text,/http:\/\/127\.0\.0\.1:5173\/ui\/@vite\/client/);
 assert.match(response.text,/http:\/\/127\.0\.0\.1:5173\/ui\/@react-refresh/);
 assert.match(response.text,/http:\/\/127\.0\.0\.1:5173\/ui\/src\/main\.tsx/);
 assert.match(response.text,/injectIntoGlobalHook\(window\)/);assert.match(response.text,/__vite_plugin_react_preamble_installed__/);
 assert.doesNotMatch(response.text,/\/ui\/assets\/|csrfToken|foundation_session|startup\.js/);
 const urls=[...response.text.matchAll(/https?:\/\/[^\s"'<>]+/g)].map(match=>match[0]);
 assert.equal(urls.length,3);for(const url of urls)assert.equal(new URL(url).origin,'http://127.0.0.1:5173');
}
test('Frontend dev: ausência da flag e valor 0 preservam o HTML estático',async t=>{
 for(const flag of [undefined,'0']){
  const previous=process.env.FRONTEND_DEV;if(flag===undefined)delete process.env.FRONTEND_DEV;else process.env.FRONTEND_DEV=flag;
  try{const f=await fixture(t);assert.equal((await page(f)).text,builtHtml);}finally{if(previous===undefined)delete process.env.FRONTEND_DEV;else process.env.FRONTEND_DEV=previous;}
 }
});
test('Frontend dev: FRONTEND_DEV=1 entrega HTML Node com preâmbulo e módulos Vite',async t=>{
 environment(t,'1');const f=await fixture(t);devEntry(await page(f));
});
test('Frontend dev: modo é capturado no startup, sem detecção automática de Vite',async t=>{
 environment(t,'1');const f=await fixture(t);process.env.FRONTEND_DEV='0';devEntry(await page(f));
});
test('Frontend dev: query, headers e cookies não ativam o modo dev',async t=>{
 environment(t,undefined);const f=await fixture(t);
 const response=await page(f,'/ui/?FRONTEND_DEV=1&dev=1&vite=http://untrusted.example',{'x-frontend-dev':'1','frontend-dev':'1',cookie:'FRONTEND_DEV=1; dev=1'});
 assert.equal(response.text,builtHtml);assert.equal(response.headers.get('access-control-allow-origin'),null);
});
test('Frontend dev: API e legado permanecem independentes no modo ativo',async t=>{
 environment(t,'1');const f=await fixture(t),legacy=await page(f,'/'),health=await page(f,'/api/health');
 assert.equal(legacy.text,fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8'));
 assert.deepEqual(JSON.parse(health.text),{ready:true,local:true,version:require('./package.json').version});assert.equal(health.status,200);
 assert.equal(health.headers.get('access-control-allow-origin'),null);assert.equal((await f.owner.call('/api/auth/me')).status,200);
 assert.equal((await f.owner.call('/api/auth/me')).data.user.id,f.ownerId);
});
test('Frontend dev: configuração inválida é recusada antes de iniciar o runtime',t=>{
 environment(t,undefined);
 for(const value of ['true','yes','2','http://untrusted.example'])assert.throws(()=>createServer({environment:'test',filename:':memory:',importLegacy:false,frontendDev:value}),/FRONTEND_DEV/);
 process.env.FRONTEND_DEV='invalid';assert.throws(()=>createServer({environment:'test',filename:':memory:',importLegacy:false}),/FRONTEND_DEV/);
});
test('Frontend dev: entrada independe de dist e da disponibilidade do processo Vite',async t=>{
 environment(t,'1');const realpath=fs.realpathSync,dist=path.join(__dirname,'frontend/dist');
 t.mock.method(fs,'realpathSync',function(filename,...args){if(path.resolve(String(filename))===dist)throw Object.assign(new Error('Missing isolated build'),{code:'ENOENT'});return realpath.call(this,filename,...args);});
 const f=await fixture(t);devEntry(await page(f));assert.equal((await page(f,'/')).status,200);assert.equal((await page(f,'/api/health')).status,200);
});
test('Frontend dev: dist ausente com modo desligado mantém o 503 estático',async t=>{
 environment(t,'0');const realpath=fs.realpathSync,dist=path.join(__dirname,'frontend/dist');
 t.mock.method(fs,'realpathSync',function(filename,...args){if(path.resolve(String(filename))===dist)throw Object.assign(new Error('Missing isolated build'),{code:'ENOENT'});return realpath.call(this,filename,...args);});
 const f=await fixture(t);assert.equal((await page(f)).status,503);assert.equal((await page(f,'/api/health')).status,200);
});
test('Frontend dev: entrada preserva métodos, paths e validação de Host',async t=>{
 environment(t,'1');const f=await fixture(t);
 assert.equal((await fetch(f.owner.origin+'/ui/',{method:'POST'})).status,404);
 for(const url of ['/ui/src/main.tsx','/ui/rota-inexistente','/ui/assets/missing.js'])assert.equal((await page(f,url)).status,404);
 const status=await new Promise((resolve,reject)=>{const req=http.get(f.owner.origin+'/ui/',{headers:{Host:'untrusted.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);});assert.equal(status,403);
});
