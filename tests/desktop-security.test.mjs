import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {validSite,externalUrl,validate,operations}=require('../desktop/security.cjs');
test('native website scope excludes siblings, credentials and lookalikes',()=>{
 assert.equal(validSite('https://ding-ding-projects.github.io/jackson-chung/'),true);
 for(const url of ['http://ding-ding-projects.github.io/jackson-chung/','https://ding-ding-projects.github.io/other/','https://ding-ding-projects.github.io.evil.test/jackson-chung/','https://user@ding-ding-projects.github.io/jackson-chung/','https://ding-ding-projects.github.io/jackson-chung/../other/'])assert.equal(validSite(url),false,url);
});
test('external links cannot invoke local executables or include credentials',()=>{
 assert.equal(externalUrl('https://ollama.com/library'),'https://ollama.com/library');
 for(const url of ['file:///C:/private','javascript:alert(1)','https://user:secret@example.com','data:text/html,test'])assert.throws(()=>externalUrl(url));
});
test('IPC rejects unknown operations, oversized requests and malformed objects',()=>{
 for(const op of ['shell.exec','file.read','fs.write','constructor','__proto__'])assert.throws(()=>validate(op,{}));
 assert.throws(()=>validate('store.write',{value:'x'.repeat(1048576)}));
 assert.throws(()=>validate('store.read',[]));
 assert.throws(()=>validate('store.read',null));
 for(const op of operations)assert.deepEqual(validate(op),{});
});
