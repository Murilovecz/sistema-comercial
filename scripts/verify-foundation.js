'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{Script}=require('node:vm'),{wrap}=require('node:module');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa/foundation-v1');fs.mkdirSync(qa,{recursive:true});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{if(['.git','.qa','data','node_modules'].includes(entry.name))return[];const file=path.join(dir,entry.name);return entry.isDirectory()?files(file):[file];});}
const all=files(root),errors=[],secretFindings=[];
for(const file of all.filter(file=>file.endsWith('.js'))){try{new Script(wrap(fs.readFileSync(file,'utf8').replace(/^#![^\n]*\n/,'')),{filename:file});}catch{errors.push({file:path.relative(root,file),check:'syntax'});}}
const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['github-token',/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/],['aws-access',/\bAKIA[A-Z0-9]{16}\b/],['api-secret',/\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b/]];
for(const file of all.filter(file=>/\.(js|json|md|sql|cmd)$/.test(file)&&!file.endsWith('.test.js'))){const source=fs.readFileSync(file,'utf8');for(const [kind,pattern]of patterns)if(pattern.test(source))secretFindings.push({file:path.relative(root,file),kind});}
if(secretFindings.length)errors.push({check:'secret-patterns',findings:secretFindings});
const missingLinks=[];
for(const file of all.filter(file=>file.endsWith('.md')&&(file.startsWith(path.join(root,'docs'))||file===path.join(root,'AGENTS.md')))){
 const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/\]\(([^)]+)\)/g)){let target=match[1].replace(/^<|>$/g,'').split('#')[0];if(!target||/^(?:https?:|app:|chatgpt-|codex:)/.test(target))continue;target=target.replace(/:\d+$/,'');if(!fs.existsSync(path.resolve(path.dirname(file),target)))missingLinks.push({file:path.relative(root,file),target});}
}
if(missingLinks.length)errors.push({check:'document-links',missing:missingLinks});
const baseline=path.join(qa,'baseline-v0.12.0'),manifest=JSON.parse(fs.readFileSync(path.join(baseline,'MANIFEST.json'),'utf8')),changedBaseline=[];
for(const [file,expected]of Object.entries(manifest.files)){const target=path.join(baseline,file);if(!fs.existsSync(target)||digest(fs.readFileSync(target))!==expected)changedBaseline.push(file);}
const originalUnchanged=digest(fs.readFileSync(path.join(root,'data/database.json')))===manifest.files['data\\database.json'];
if(changedBaseline.length||!originalUnchanged)errors.push({check:'baseline-data',changedBaseline,originalUnchanged});
const report={date:new Date().toISOString(),node:process.version,syntaxMethod:'Node vm.Script, CommonJS wrapper, parse only without execution',syntaxFiles:all.filter(file=>file.endsWith('.js')).length,documentLinksChecked:true,missingLinks,secretPatternsFound:secretFindings,baselineFiles:Object.keys(manifest.files).length,changedBaseline,originalUnchanged,errors};
fs.writeFileSync(path.join(qa,'verification-final.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
