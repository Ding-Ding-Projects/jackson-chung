import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {resolveAsset}=require('../desktop/protocol.cjs');
const root=path.resolve('test-dist');
test('packaged standard origin resolves exact relative assets',()=>{
 assert.equal(resolveAsset('app://jackson/index.html#tools',root),path.join(root,'index.html'));
 assert.equal(resolveAsset('app://jackson/assets/chunk.js',root),path.join(root,'assets','chunk.js'));
});
test('packaged origin rejects traversal, repeated encoding and other origins',()=>{
 for(const value of ['https://jackson/index.html','app://other/index.html','app://user@jackson/index.html','app://jackson:123/index.html','app://jackson/../secret','app://jackson/%2e%2e/secret','app://jackson/%252e%252e/secret','app://jackson/..%5csecret','app://jackson/C:/secret','app://jackson/%00secret'])assert.throws(()=>resolveAsset(value,root),value);
});
