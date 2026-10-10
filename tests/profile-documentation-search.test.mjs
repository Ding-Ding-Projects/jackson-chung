import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function reader(mutation=false){
 let source=readFileSync(new URL('../src/components/documentation.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('import.meta.env.BASE_URL',"'/jackson-chung/'").replace("customElements.define('jc-documentation',Documentation);",'exports.Reader=Documentation;');
 if(mutation)source=source.replace("search.setActive(this.activeTab);", "");
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('exports','LitElement','html','css','nothing',code)(exports,class{},()=>{},()=>{},null);
 const instance=new exports.Reader();instance.articles=[{id:'a'},{id:'b'}];return instance;
}
function search(){return {fieldId:'field',updateComplete:Promise.resolve(),state:{query:'retained',mode:'literal'},cancels:0,restarts:0,active:true,setActive(active){if(!active)this.cancels++;else if(!this.active)this.restarts++;this.active=active;},getResults(){return {fieldId:this.fieldId};},getSearchState(){return {...this.state};},setSearchState(value){this.state=value;this.restarts++;}};}
function mount(instance,child){instance.renderRoot={querySelector:()=>child};}
test('Actual reader rejects stale, invalid, pending and foreign results without keeping matches',()=>{
 const instance=reader(),child=search();mount(instance,child);
 const send=detail=>instance.searchResults({target:child,detail});
 const valid={fieldId:'field',ids:['b'],indices:[1],valid:true};send(valid);assert.deepEqual(instance.matchedIds,['b']);
 for(const detail of [{...valid,fieldId:'old'},{...valid,ids:['a']},{...valid,indices:[9]},{...valid,valid:false,reason:'pending'}]){send(valid);send(detail);assert.deepEqual(instance.matchedIds,[]);assert.equal(instance.searchValid,false);}
 send(valid);instance.searchResults({target:{},detail:{...valid,valid:false}});assert.deepEqual(instance.matchedIds,['b']);
 instance.activeTab=false;send(valid);assert.deepEqual(instance.matchedIds,[]);
});
test('Actual inactive lifecycle waits for child updates then cancels and restarts retained field state',async()=>{
 const instance=reader(),child=search();mount(instance,child);let settle;child.updateComplete=new Promise(resolve=>settle=resolve);
 instance.activeTab=false;const pending=instance.syncSearchLifecycle();assert.equal(child.cancels,0);settle();await pending;assert.equal(child.cancels,1);assert.equal(instance.searchReason,'inactive');
 instance.activeTab=true;await instance.syncSearchLifecycle();assert.equal(child.restarts,1);assert.equal(child.state.query,'retained');
 const other=reader(),otherChild=search();otherChild.state.query='another tab';mount(other,otherChild);assert.equal(child.state.query,'retained');assert.equal(otherChild.state.query,'another tab');
});
test('Superseded lifecycle cannot cancel a newly active reader',async()=>{
 const instance=reader(),child=search();mount(instance,child);let settle;child.updateComplete=new Promise(resolve=>settle=resolve);
 instance.activeTab=false;const old=instance.syncSearchLifecycle();instance.activeTab=true;const current=instance.syncSearchLifecycle();settle();await Promise.all([old,current]);assert.equal(child.cancels,0);
});
test('Reader template owns one full builder with context and language controls',()=>{
 const source=readFileSync(new URL('../src/components/documentation.ts',import.meta.url),'utf8');assert.ok(source.includes('<jc-documentation-search'));assert.ok(!source.includes('<md-outlined-text-field'));for(const property of ['.active=${this.activeTab}','.articles=','.locale=','.context=','.funnyEn=','.funnyYue='])assert.ok(source.includes(property));
 const shell=readFileSync(new URL('../src/app.ts',import.meta.url),'utf8');assert.ok(shell.includes('<jc-documentation .context=${this.context}'));
});

test("Inactive cancellation assertion detects the removed lifecycle operation",async()=>{const instance=reader(true),child=search();mount(instance,child);instance.activeTab=false;await instance.syncSearchLifecycle();assert.throws(()=>assert.equal(child.cancels,1));});
