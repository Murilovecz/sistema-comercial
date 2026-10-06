'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');

test('Vite dev: ferramentas em loopback, CORS específico, arquivos privados negados e nenhuma API/fallback HTML',async t=>{
 const frontend=path.join(__dirname,'frontend');
 const {createServer}=await import(pathToFileURL(require.resolve('vite',{paths:[frontend]})).href);
 const vite=await createServer({configFile:path.join(frontend,'vite.config.ts')});
 t.after(()=>vite.close());await vite.listen();
 assert.equal(vite.httpServer.address().address,'127.0.0.1');assert.equal(vite.httpServer.address().port,5173);
 const origin='http://127.0.0.1:3210',base='http://127.0.0.1:5173/ui';
 for(const requestOrigin of [origin,'http://untrusted.example']){
  const response=await fetch(base+'/src/main.tsx',{headers:{Origin:requestOrigin}});
  assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),origin);
  assert.match(await response.text(),/createRoot/);
 }
 const host=await new Promise((resolve,reject)=>{const req=http.get(base+'/src/main.tsx',{headers:{Host:'untrusted.example',Origin:origin}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);});assert.equal(host,403);
 const project=__dirname.replaceAll('\\','/');
 for(const filename of ['server.js','foundation/identity.js','public/index.html','.git/config']){
  const response=await fetch(base+'/@fs/'+project+'/'+filename,{headers:{Origin:origin}});assert.equal(response.status,403,filename);await response.text();
 }
 for(const url of [base+'/api/health',base+'/@fs/'+project+'/.qa/arquivo-inexistente-v1-3.txt',base+'/@fs/'+project+'/data/banco-inexistente-v1-3.sqlite']){
  const response=await fetch(url,{headers:{Origin:origin}});assert.equal(response.status,404,url);assert.doesNotMatch(await response.text(),/id="root"|"ready":true/);
 }
});
