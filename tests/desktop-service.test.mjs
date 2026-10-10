import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {readModelList}=require('../desktop/native-service.cjs');
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
 vm.runInNewContext(source,{require:id=>id==='electron'?electron:require(id==='./security.cjs'?'../desktop/security.cjs':id),module,Buffer,process:{...process,resourcesPath:path.join(root,'resources')},setTimeout,fetch:fetchImpl,AbortSignal,URL},{filename:'native-service.cjs'});
 return {root,service:module.exports.createService({app:{getPath:()=>root,getVersion:()=>'test'},getWindow:()=>null})};
}
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
