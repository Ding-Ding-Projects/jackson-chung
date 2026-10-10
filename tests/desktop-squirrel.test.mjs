import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8');
const tree=ts.createSourceFile('main.cjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const hook=tree.statements.find(node=>ts.isIfStatement(node)&&node.expression.getText(tree).includes('--squirrel-')).thenStatement.getText(tree);
function run(flag,results,verification=false){
 const calls=[],exits=[];
 const body=process.env.SQUIRREL_OLD_RESULT==='1'?hook.replace('shortcut.error||shortcut.status!==0||',''):hook;
 const execute=new Function('process','runtimeMode','path','require','app',body);
 execute({argv:['app',flag],execPath:'C:/owned/app-1/JacksonChung.exe'},{verification},path,id=>{assert.equal(id,'node:child_process');return {spawnSync(exe,args,options){calls.push({exe,args,options});return results[calls.length-1];}}},{exit:code=>exits.push(code),quit:()=>exits.push(0)});
 return {calls,exits};
}
for(const flag of ['--squirrel-install','--squirrel-updated','--squirrel-uninstall']){
 test(`${flag} checks both ordered operations and preserves registration after shortcut failure`,()=>{
  for(const first of [{status:0},{status:1},{status:null,error:Object.assign(new Error('timeout'),{code:'ETIMEDOUT'})},{status:null,error:Object.assign(new Error('spawn'),{code:'ENOENT'})},{status:null,signal:'SIGTERM'}]){
   for(const second of [{status:0},{status:1},{status:null,error:new Error('registration unavailable')}]){
    const result=run(flag,[first,second]);assert.equal(result.calls.length,2);assert.match(result.calls[0].exe,/Update\.exe$/);assert.match(result.calls[1].exe,/JacksonChungNativeHost\.exe$/);
    assert.deepEqual(result.calls[0].args,[flag==='--squirrel-uninstall'?'--removeShortcut':'--createShortcut','JacksonChung.exe']);assert.deepEqual(result.calls[1].args,[flag==='--squirrel-uninstall'?'--unregister':'--register']);
    for(const call of result.calls)assert.deepEqual(call.options,{windowsHide:true,timeout:15000});
    assert.deepEqual(result.exits,[first.status===0&&!first.error&&second.status===0&&!second.error?0:1]);
   }
  }
 });
}
test('Verification and obsolete hooks never launch either lifecycle child',()=>{
 for(const flag of ['--squirrel-install','--squirrel-updated','--squirrel-uninstall','--squirrel-obsolete']){const result=run(flag,[],true);assert.deepEqual(result,{calls:[],exits:[0]});}
 assert.deepEqual(run('--squirrel-obsolete',[]),{calls:[],exits:[0]});
});
