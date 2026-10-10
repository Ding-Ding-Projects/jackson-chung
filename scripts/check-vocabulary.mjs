import {existsSync,readFileSync} from 'node:fs';
import {createHash,timingSafeEqual} from 'node:crypto';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
export function checkInstructionLock(source){
 if(!source||!existsSync(source))return {skipped:true,reason:'Maintainer private instruction source is unavailable; public contributors may build.'};
 const text=readFileSync(source,'utf8').replaceAll('\r\n','\n');
 const start=text.indexOf('## Vocabulary and locations');const end=text.indexOf('## The conversation voice',start);
 if(start<0||end<=start)throw Error('Private instruction section could not be identified.');
 const expectedPath=source+'.lock';
 if(!existsSync(expectedPath))throw Error('Private instruction acknowledgement lock is missing. Reread the current instructions and renew their private lock.');
 const actual=createHash('sha256').update(text.slice(start,end)).digest('hex');
 const expected=readFileSync(expectedPath,'utf8').trim();
 if(!/^[0-9a-f]{64}$/.test(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))throw Error('Private instruction acknowledgement is stale. Reread the current instructions before building or publishing.');
 return {skipped:false};
}
if(process.argv[1]?.endsWith('check-vocabulary.mjs')){
 const candidates=[resolve('..','agent-global-memory','memory','SHARED_INSTRUCTIONS.md'),join(homedir(),'.agents','skills','agent-global-memory','references','memory','SHARED_INSTRUCTIONS.md')];
 try{const result=checkInstructionLock(candidates.find(existsSync));console.log(result.skipped?result.reason:'Current private instruction acknowledgement verified.');}catch(error){console.error(error.message);process.exit(1)}
}
