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
