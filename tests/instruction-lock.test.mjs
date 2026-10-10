import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {checkInstructionLock} from '../scripts/check-vocabulary.mjs';
test('public contributors without private instructions are explicitly skipped',()=>assert.equal(checkInstructionLock().skipped,true));
test('current acknowledgement passes and changed source fails without automatic renewal',()=>{
 const root=mkdtempSync(join(tmpdir(),'instruction-lock-'));const source=join(root,'instructions.md');
 const section='## Vocabulary and locations\nOriginal private section.\n';
 try{writeFileSync(source,section+'## The conversation voice\n');assert.throws(()=>checkInstructionLock(source),/missing/);
 writeFileSync(source+'.lock',createHash('sha256').update(section).digest('hex'));assert.equal(checkInstructionLock(source).skipped,false);
 writeFileSync(source,section+'Changed rule.\n## The conversation voice\n');assert.throws(()=>checkInstructionLock(source),/stale/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
