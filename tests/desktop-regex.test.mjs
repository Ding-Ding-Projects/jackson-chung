import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import ts from 'typescript';
import vm from 'node:vm';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const sharedUrl=compile(await readFile(new URL('../src/workers/regex-workbench-worker.ts',import.meta.url),'utf8'));
const stateUrl=compile((await readFile(new URL('../src/features/companion/search-state.ts',import.meta.url),'utf8')).replace('../../workers/regex-workbench-worker',sharedUrl));
const {createCompanionSearchStates,updateCompanionSearch,filterCompanionValues,companionSearchScopes,forwardCompanionSearch}=await import(stateUrl);
test('parent edits invalidate the actual shared workbench before Apply or snippet save',async()=>{
 const shared=await import(sharedUrl);let forwarding=false;let recursion=0;let applies=0;
 class FakeLit extends EventTarget{renderRoot={querySelector:()=>({value:'Test snippet'})};updateComplete=Promise.resolve()}
 class FakeWorker{terminated=false;request=null;onmessage=null;terminate(){this.terminated=true}postMessage(value){this.request=value}}
 const source=await readFile(new URL('../src/components/regex-workbench.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;const exports={};
 vm.runInNewContext(compiled.replaceAll('import.meta.url',JSON.stringify('file:///fixture/regex-workbench.ts')),{exports,require:id=>id==='lit'?{LitElement:FakeLit,html:(strings,...values)=>({strings,values}),css:()=>''}:id.includes('regex-workbench-worker')?shared:{},customElements:{define(){}},CustomEvent,Worker:FakeWorker,setTimeout,clearTimeout,URL,console});
 const Workbench=exports.RegexWorkbench;const first=new Workbench();const independent=new Workbench();
 first.fieldId='fixture.catalog';first.state={mode:'regex',query:'foo',pattern:'foo',flags:'i'};first.valid=true;first.result={matches:[{value:'foo'}]};first.worker=new FakeWorker();const oldWorker=first.worker;
 independent.state={mode:'regex',query:'other',pattern:'other',flags:'m'};independent.valid=true;const otherResult={matches:[{value:'other'}]};independent.result=otherResult;
 first.addEventListener('jc-regex-change',()=>{if(!forwarding)recursion++});first.addEventListener('jc-regex-apply',()=>applies++);
 try{
  forwardCompanionSearch(first,{mode:'regex',query:'[',pattern:'[',flags:'i'},active=>{forwarding=active});
  assert.equal(oldWorker.terminated,true);assert.equal(first.valid,false);assert.equal(first.result,undefined);assert.equal(first.worker,undefined);assert.equal(recursion,0);assert.equal(first.getSearchState().pattern,'[');
  first.apply();first.saveSnippet();assert.equal(applies,0);assert.equal(first.snippets.length,0);
  assert.equal(independent.valid,true);assert.equal(independent.result,otherResult);assert.equal(independent.state.pattern,'other');
  first.evaluate();const invalidWorker=first.worker;assert.equal(invalidWorker.request.state.pattern,'[');invalidWorker.onmessage({data:{ok:false,error:'syntax'}});assert.equal(first.valid,false);first.apply();assert.equal(applies,0);
  forwardCompanionSearch(first,{mode:'regex',query:'bar',pattern:'bar',flags:'m'},active=>{forwarding=active});assert.equal(first.valid,false);first.evaluate();const validWorker=first.worker;assert.equal(validWorker.request.state.pattern,'bar');assert.equal(validWorker.request.state.flags,'m');validWorker.onmessage({data:{ok:true,result:{matches:[],elapsedMs:1}}});assert.equal(first.valid,true);first.apply();assert.equal(applies,1);
 }finally{first.cancel();independent.cancel();clearTimeout(first.debounce);clearTimeout(independent.debounce)}
 const parentSource=await readFile(new URL('../src/features/companion/index.ts',import.meta.url),'utf8');assert.ok(parentSource.includes('forwardCompanionSearch(workbench,this.searches[scope]'));assert.ok(parentSource.includes('this.forwardingSearches.has(scope)'));assert.ok(parentSource.includes('this.updateComplete.then'));assert.equal(parentSource.includes('.state=${state}'),false);
});
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
