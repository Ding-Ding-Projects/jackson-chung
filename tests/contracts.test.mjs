import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateInventory} from '../scripts/check-contracts.mjs';
const source=JSON.parse(readFileSync(new URL('../contracts/features.json',import.meta.url)));
test('unfinished universal delivery cannot pass from a populated identifier list alone',()=>{
 assert.equal(source.required.length,104);
 assert.ok(validateInventory(source).some(x=>x==='website/language: missing inventory row'));
});
test('removing an owed contract cannot shrink the completeness check',()=>{
 const changed=structuredClone(source);changed.required=changed.required.filter(x=>x!=='language');
 assert.throws(()=>validateInventory(changed),/retained baseline/);
});
test('removing a supported surface cannot hide its missing evidence',()=>{
 const changed=structuredClone(source);changed.surfaces=changed.surfaces.filter(x=>x!=='website');
 assert.throws(()=>validateInventory(changed),/surface inventory/);
});

test('owner presentation exception changes exactly one surface and leaves delivery incomplete',()=>{
 const failures=validateInventory(source);
 assert.equal(failures.length,296);
 assert.ok(!failures.includes('website/material-design: missing inventory row'));
 for(const pair of ['desktop/material-design','extension/material-design','website/language','website/accessibility-sizing'])assert.ok(failures.includes(`${pair}: missing inventory row`));
 const changed=structuredClone(source);delete changed.surfaceExceptions;
 assert.equal(validateInventory(changed).length,297);
 assert.ok(validateInventory(changed).includes('website/material-design: missing inventory row'));
});

test('surface exception cannot widen to other surfaces or contracts',()=>{
 for(const mutation of [{surface:'desktop'},{surface:'extension'},{id:'language'},{id:'accessibility-sizing'},{basis:'inferred'},{documentation:'README.md'}]){
  const changed=structuredClone(source);Object.assign(changed.surfaceExceptions[0],mutation);
  assert.throws(()=>validateInventory(changed),/Unauthorized or undocumented/);
 }
});

test('global notes cannot conceal new missing obligations',()=>{
 for(const id of ['material-design','language','unknown']){
  const changed=structuredClone(source);changed.scopeNotes[id]='Skip this requirement';
  assert.throws(()=>validateInventory(changed),/Invalid global scope note/);
 }
 const changed=structuredClone(source);changed.scopeNotes['roblox-visual-realism']=' ';
 assert.throws(()=>validateInventory(changed),/Invalid global scope note/);
});

test('malformed or duplicate exceptions fail closed',()=>{
 for(const mutation of [entry=>{entry.reason=' ';},entry=>{entry.reason='x'.repeat(1001);},entry=>{delete entry.basis;},entry=>{entry.extra=true;}]){
  const changed=structuredClone(source);mutation(changed.surfaceExceptions[0]);
  assert.throws(()=>validateInventory(changed));
 }
 const duplicate=structuredClone(source);duplicate.surfaceExceptions.push(structuredClone(duplicate.surfaceExceptions[0]));
 assert.throws(()=>validateInventory(duplicate),/Duplicate/);
 const malformed=structuredClone(source);malformed.surfaceExceptions={};
 assert.throws(()=>validateInventory(malformed),/Invalid surface exceptions/);
});
