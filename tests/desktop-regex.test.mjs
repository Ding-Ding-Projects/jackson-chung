import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import ts from 'typescript';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const sharedUrl=compile(await readFile(new URL('../src/workers/regex-workbench-worker.ts',import.meta.url),'utf8'));
const stateUrl=compile((await readFile(new URL('../src/features/companion/search-state.ts',import.meta.url),'utf8')).replace('../../workers/regex-workbench-worker',sharedUrl));
const {createCompanionSearchStates,updateCompanionSearch,filterCompanionValues,companionSearchScopes}=await import(stateUrl);
test('each actual companion search has independent literal-default state and anchored workbench',async()=>{
 const states=createCompanionSearchStates();assert.deepEqual(companionSearchScopes,['catalog','models','records']);assert.notEqual(states.catalog,states.models);assert.notEqual(states.models,states.records);
 const updated=updateCompanionSearch(states,'catalog',{query:'a.b'});assert.equal(updated.catalog.mode,'literal');assert.equal(updated.catalog.pattern,'a\\.b');assert.equal(updated.models.query,'');assert.equal(updated.records.query,'');
 const regex=updateCompanionSearch(updated,'catalog',{mode:'regex',pattern:'^tag$',flags:'m'});assert.equal(regex.catalog.query,'^tag$');assert.equal(regex.catalog.flags,'m');assert.equal(updated.catalog.query,'a.b');
 const source=await readFile(new URL('../src/features/companion/index.ts',import.meta.url),'utf8');for(const field of ['catalog','models','records'])assert.ok(source.includes(`this.searchField('${field}',`),`${field} workbench missing`);assert.ok(source.includes('<jc-regex-workbench'));assert.ok(source.includes('@jc-regex-change'));assert.ok(source.includes('@jc-regex-apply'));assert.ok(source.includes('draftTabId(this)'));
 assert.deepEqual(Object.keys(regex.catalog).sort(),['flags','mode','pattern','query']);
});
test('literal and real regex filtering honor flags and reset global/sticky state per item',()=>{
 const literal={mode:'literal',query:'a.b',pattern:'a\\.b',flags:'i'};assert.deepEqual(filterCompanionValues(['A.B','axb','a.b'],literal),[0,2]);
 for(const flags of ['g','y','gi'])assert.deepEqual(filterCompanionValues(['tag','tag','TAG'],{mode:'regex',query:'tag',pattern:'tag',flags}),flags==='gi'?[0,1,2]:[0,1]);
 assert.deepEqual(filterCompanionValues(['x\nTAG','tag'],{mode:'regex',query:'^TAG$',pattern:'^TAG$',flags:'m'}),[0]);assert.throws(()=>filterCompanionValues(['text'],{mode:'regex',query:'[',pattern:'[',flags:'i'}));assert.throws(()=>filterCompanionValues(['text'],{...literal,flags:'ii'}));
});
test('filter results contain indices only and never samples or captures',()=>{
 const privateText='private fixture text';const state={mode:'regex',query:'(?<value>private)',pattern:'(?<value>private)',flags:'i'};const result=filterCompanionValues([privateText,'other'],state);assert.deepEqual(result,[0]);assert.equal(JSON.stringify(result).includes(privateText),false);assert.equal(JSON.stringify(createCompanionSearchStates()).includes('sample'),false);
});
test('pathological companion expressions are terminated in an actual worker',async()=>{
 const source=(await readFile(new URL('../src/features/companion/catalog-search.worker.ts',import.meta.url),'utf8')).replace('./search-state',stateUrl);const workerUrl=compile(source);
 const bootstrap=`const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=value=>parentPort.postMessage(value);import(${JSON.stringify(workerUrl)}).then(()=>parentPort.on('message',data=>globalThis.onmessage({data})));`;
 const worker=new Worker(bootstrap,{eval:true});let replied=false;worker.on('message',()=>{replied=true});worker.postMessage({values:['a'.repeat(10000)+'!'],state:{mode:'regex',query:'(a+)+$',pattern:'(a+)+$',flags:''}});await new Promise(resolve=>setTimeout(resolve,400));await worker.terminate();assert.equal(replied,false);
});
