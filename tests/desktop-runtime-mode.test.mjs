import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const {runtimeMode,configureRuntime,verificationPackageId}=createRequire(import.meta.url)('../desktop/runtime-mode.cjs');
function fixture(run){const root=mkdtempSync(join(tmpdir(),'jc-runtime-mode-'));try{return run(root);}finally{rmSync(root,{recursive:true,force:true});}}
test('Production without an embedded mode manifest does not change application paths',()=>fixture(root=>{let changes=0;const mode=configureRuntime({getPath:()=>root,setName:()=>changes++,setPath:()=>changes++},root);assert.equal(mode.verification,false);assert.equal(changes,0);assert.equal(existsSync(join(root,verificationPackageId)),false);}));
test('Verification uses its genuine separate application and session data directories',()=>fixture(root=>{writeFileSync(join(root,'runtime-mode.json'),JSON.stringify({version:1,mode:'verification',packageId:verificationPackageId}));const paths={};let name;const mode=configureRuntime({getPath:()=>root,setName:value=>name=value,setPath:(key,value)=>{assert.ok(existsSync(value));paths[key]=value;}},root);assert.equal(name,verificationPackageId);assert.equal(paths.userData,join(root,verificationPackageId));assert.equal(paths.sessionData,paths.userData);assert.equal(mode.verification,true);}));
test('Malformed, injected or oversized mode manifests fail before creating profile data',()=>fixture(root=>{for(const value of [{version:1,mode:'verification',packageId:'../JacksonChung'},{version:1,mode:'production',packageId:verificationPackageId},{version:1,mode:'verification',packageId:verificationPackageId,extra:true},null]){writeFileSync(join(root,'runtime-mode.json'),JSON.stringify(value));assert.throws(()=>runtimeMode(root,root));assert.equal(existsSync(join(root,verificationPackageId)),false);}writeFileSync(join(root,'runtime-mode.json'),' '.repeat(513));assert.throws(()=>runtimeMode(root,root));}));
