import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {readModelList,parseCatalogPage,acquireCatalog,hardwareFit,validateCatalogCache}=require('../desktop/native-service.cjs');
async function verifiedFixture(names=['fixture:a','fixture:b']){return acquireCatalog(async url=>({text:url==='https://ollama.com/library'?'<a href="/library/fixture">Fixture</a>':names.map(name=>`<a href="/library/${name}">${name}</a>`).join('')}));}
test('cache schema rejects corrupted provenance, variant ordering and metadata',async()=>{
 const valid=await verifiedFixture();assert.equal(validateCatalogCache(valid),valid);
 for(const mutate of [value=>value.variants=[{}],value=>value.variants.reverse(),value=>value.variants.push(value.variants[0]),value=>value.variants[0].name='other:a',value=>value.variants[0].metadata={},value=>value.pageCount++,value=>value.modelCount++,value=>value.refreshedAt='invalid',value=>value.pages[0].sha256='bad',value=>value.pages[0].url='https://evil.test/library',value=>value.responseIdentity='a'.repeat(64)]){const candidate=structuredClone(valid);mutate(candidate);assert.throws(()=>validateCatalogCache(candidate));}
});
test('catalog traversal includes every model page and every tag page with identities',async()=>{
 const pages={
 'https://ollama.com/library':'<a href="/library/alpha">Alpha</a><a href="/library?page=2">Next</a>',
 'https://ollama.com/library?page=2':'<a href="/library/beta">Beta</a>',
 'https://ollama.com/library/alpha/tags':'<a href="/library/alpha:one">One</a><a href="/library/alpha/tags?page=2">Next tags</a>',
 'https://ollama.com/library/alpha/tags?page=2':'<a href="/library/alpha:two">Two</a>',
 'https://ollama.com/library/beta/tags':'<a href="/library/beta:latest">Latest</a>'};
 const result=await acquireCatalog(async url=>({text:pages[url]}));
 assert.deepEqual(result.variants.map(row=>row.name),['alpha:one','alpha:two','beta:latest']);assert.equal(result.pageCount,5);assert.equal(result.modelCount,2);assert.equal(result.completeness,'complete-source-enumeration');assert.equal(result.pages.length,5);assert.match(result.responseIdentity,/^[a-f0-9]{64}$/);assert.ok(Date.parse(result.lastSuccessfulRefresh));
 const noSecondTag={...pages,'https://ollama.com/library/alpha/tags?page=2':'<html>No tags</html>'};
 await assert.rejects(acquireCatalog(async url=>({text:noSecondTag[url]})),/markup changed/);
});
test('catalog parser rejects empty source, ignores foreign hosts and deduplicates tags',()=>{
 assert.throws(()=>parseCatalogPage('<html>changed</html>','models'),/markup changed/);
 assert.deepEqual(parseCatalogPage('<a href="https://evil.test/library/m:bad">Bad</a><a href="/library/m:ok">OK</a><a href="/library/m:ok">Duplicate</a>','tags','m').names,['m:ok']);
});
test('relative tag pagination resolves against its fetched tag page',async()=>{
 const pages={
  'https://ollama.com/library':'<a href="/library/example">Example</a>',
  'https://ollama.com/library/example/tags':'<a href="/library/example:latest">Latest</a><a href="?page=2">Next</a>',
  'https://ollama.com/library/example/tags?page=2':'<a href="/library/example:second">Second</a>'};
 const result=await acquireCatalog(async url=>({text:pages[url]}));
 assert.deepEqual(result.variants.map(row=>row.name),['example:latest','example:second']);assert.equal(result.pageCount,3);
});
test('malformed cache variants are unavailable instead of crashing the renderer',async()=>{
 const {root,service}=await fixture();try{
  await fs.mkdir(path.join(root,'private-data'),{recursive:true});
  await fs.writeFile(path.join(root,'private-data','catalog.json'),JSON.stringify({source:'https://ollama.com/library',completeness:'complete-source-enumeration',responseIdentity:'a'.repeat(64),variants:[{}]}));
  const result=await service.request('ollama.catalog');assert.equal(result.available,false);assert.equal(result.total,0);assert.deepEqual(JSON.parse(JSON.stringify(result.variants)),[]);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
test('hardware fit uses evidence and configured overhead for all four conservative verdicts',()=>{
 const metadata={blobBytes:100,parameterCount:42,quantization:'verified-Q4',contextLength:4096};
 const hardware={ramFreeBytes:1000,destinationFreeBytes:1000,usableVramBytes:1000,backendSupported:true,architecture:'x64'};
 assert.equal(hardwareFit(metadata,hardware,100).verdict,'Runs well');
 assert.equal(hardwareFit(metadata,{...hardware,usableVramBytes:100},100).verdict,'Runs with limits');
 assert.equal(hardwareFit(metadata,{...hardware,destinationFreeBytes:150},100).verdict,'Unlikely');
 assert.equal(hardwareFit(metadata,{...hardware,ramFreeBytes:150},100).verdict,'Unlikely');
 assert.equal(hardwareFit(metadata,{...hardware,backendSupported:null},100).verdict,'Unknown');
 assert.equal(hardwareFit({...metadata,quantization:null},hardware,100).verdict,'Unknown');
 assert.equal(hardwareFit({name:'tiny-guaranteed-fast'},hardware,100).verdict,'Unknown');
 assert.equal(hardwareFit(metadata,hardware,1001).verdict,'Unlikely');
 const result=hardwareFit(metadata,hardware,100);assert.deepEqual(result.evidence,{metadata,hardware,overheadBytes:100});assert.ok(Date.parse(result.computedAt));
});
test('offline catalog keeps last verified inventory and paginates without dropping variants',async()=>{
 const {root,service}=await fixture(true,async()=>{throw Error('offline')});
 try{
  const directory=path.join(root,'private-data');await fs.mkdir(directory,{recursive:true});
  const verified=await verifiedFixture(Array.from({length:151},(_,index)=>`fixture:tag-${index}`));verified.refreshedAt='2026-01-01T00:00:00.000Z';verified.lastSuccessfulRefresh=verified.refreshedAt;
  await fs.writeFile(path.join(directory,'catalog.json'),JSON.stringify(verified));
  const first=await service.request('ollama.catalog',{offset:0});const second=await service.request('ollama.catalog',{offset:first.nextOffset});assert.equal(first.variants.length,100);assert.equal(second.variants.length,51);assert.equal(second.nextOffset,null);assert.ok(first.staleAgeSeconds>0);
  const {id}=await service.request('ollama.catalog.refresh');await new Promise(resolve=>setImmediate(resolve));const task=await service.request('task.poll',{id});assert.equal(task.done,true);assert.ok(task.error);
  await fs.writeFile(path.join(directory,'catalog.json'),JSON.stringify({variants:[{}]}));
  const retained=await service.request('ollama.catalog');assert.equal(retained.total,151);assert.equal(retained.responseIdentity,verified.responseIdentity);assert.ok(retained.lastError);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
test('model metadata readers bound bytes and validate official model lists',async()=>{
 assert.deepEqual(await readModelList(new Response(JSON.stringify({models:[{name:'example:tag',size:12}]}))),{models:[{name:'example:tag',size:12}]});
 await assert.rejects(readModelList(new Response('x'.repeat(1048577))),/exceeds/);
 await assert.rejects(readModelList(new Response('{}')),/Invalid/);
 await assert.rejects(readModelList(new Response(JSON.stringify({models:[{name:'x',size:-1}]}))),/Invalid/);
 await assert.rejects(readModelList(new Response('{')));
});
async function fixture(encryption=true,fetchImpl=fetch){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'jc-native-test-'));
 const source=await fs.readFile(new URL('../desktop/native-service.cjs',import.meta.url),'utf8');
 const module={exports:{}};
 const electron={safeStorage:{isEncryptionAvailable:()=>encryption,encryptString:s=>Buffer.from('encrypted:'+s).reverse(),decryptString:b=>Buffer.from(b).reverse().toString().slice(10)},dialog:{},shell:{}};
 vm.runInNewContext(source,{require:id=>id==='electron'?electron:require(id==='./security.cjs'?'../desktop/security.cjs':id),module,Buffer,TextDecoder,process:{...process,resourcesPath:path.join(root,'resources')},setTimeout,fetch:fetchImpl,AbortSignal,AbortController,URL},{filename:'native-service.cjs'});
 return {root,service:module.exports.createService({app:{getPath:()=>root,getVersion:()=>'test'},getWindow:()=>null})};
}
for(const invalidTail of [false,true])test(`completed streaming task drains every chunk before terminal state${invalidTail?' with producer error':''}`,async()=>{
 const expected=Array.from({length:251},(_,index)=>`piece-${index};`);
 const body=expected.map(content=>JSON.stringify({message:{content}})).join('\n')+'\n'+(invalidTail?'invalid-json\n':'');
 const {root,service}=await fixture(true,async()=>new Response(body));
 try{
  const {id}=await service.request('ollama.chat',{model:'test:local',prompt:'test'});
  // Allow the final producer to finish before the first consumer poll.
  await new Promise(resolve=>setImmediate(resolve));
  const first=await service.request('task.poll',{id});
  assert.equal(first.chunks.length,100);assert.equal(first.done,false);
  const second=await service.request('task.poll',{id});
  assert.equal(second.chunks.length,100);assert.equal(second.done,false);
  const final=await service.request('task.poll',{id});
  assert.equal(final.chunks.length,51);assert.equal(final.done,true);
  assert.equal([...first.chunks,...second.chunks,...final.chunks].map(chunk=>chunk.message.content).join(''),expected.join(''));
  assert.equal(Boolean(final.error),invalidTail);
  const drained=await service.request('task.poll',{id});assert.equal(drained.chunks.length,0);assert.equal(drained.done,true);assert.equal(drained.error,final.error);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
test('local model transport never follows redirects and reports service failure',async()=>{
 let seen;
 const {root,service}=await fixture(true,async(url,options)=>{seen={url,options};return new Response('',{status:503})});
 try {await assert.rejects(service.request('ollama.tags'),/rejected/);assert.equal(seen.url,'http://127.0.0.1:11434/api/tags');assert.equal(seen.options.redirect,'error');assert.ok(seen.options.signal);}finally{await fs.rm(root,{recursive:true,force:true})}
});
test('encrypted save survives unavailable history and reports its exact recovery',async()=>{
 const {root,service}=await fixture();try{
 const saved=await service.request('store.write',{value:{privateNote:'private sample'}});
 assert.equal(saved.saved,true);assert.equal(saved.historySaved,false);
 assert.deepEqual(JSON.parse(JSON.stringify(await service.request('store.read'))),{privateNote:'private sample'});
 const bytes=await fs.readFile(path.join(root,'private-data','store.enc'));
 assert.equal(bytes.includes(Buffer.from('private sample')),false);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
test('unavailable OS encryption fails closed without creating plaintext records',async()=>{
 const {root,service}=await fixture(false);try{await assert.rejects(service.request('store.write',{value:{secret:'sample'}}));await assert.rejects(fs.access(path.join(root,'private-data','store.enc')));}finally{await fs.rm(root,{recursive:true,force:true})}
});
test('grants are individually scoped and revocation invalidates them',async()=>{
 const {root,service}=await fixture();try{const grant=await service.request('pairing.create',{capabilities:['ollama.tags','file.import','shell.exec']});assert.equal(service.authorize(grant.token,'ollama.tags'),true);assert.equal(service.authorize(grant.token,'file.import'),false);assert.equal(service.authorize(grant.token,'ollama.chat'),false);await service.request('pairing.revoke');assert.equal(service.authorize(grant.token,'ollama.tags'),undefined);}finally{await fs.rm(root,{recursive:true,force:true})}
});
test('history requires its local password and explicit lock revokes access',async()=>{
 const {root,service}=await fixture();try{
 await assert.rejects(service.request('history.list'),/Unlock history/);
 await service.request('history.unlock',{password:'test-only-passphrase'});
 await service.request('history.lock');
 await assert.rejects(service.request('history.restore',{id:'a'.repeat(40)}),/Unlock history/);
 await assert.rejects(service.request('history.unlock',{password:'different-test-password'}),/Invalid password/);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
