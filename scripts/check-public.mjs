import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const candidates=[join(homedir(),'.agents','skills','agent-global-memory','scripts','vocabulary-dictionary.mjs'),join(process.cwd(),'..','agent-global-memory','scripts','vocabulary-dictionary.mjs')];
const provider=candidates.find(existsSync);
const revision=process.argv[2];
const files=execFileSync('git',revision?['ls-tree','-r','--name-only',revision]:['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
let matchers=[];
if(provider){const {getLeakableVocabularyTerms,buildLeakDetectionMatcher}=await import(pathToFileURL(provider).href);matchers=getLeakableVocabularyTerms().map(x=>buildLeakDetectionMatcher(x.literal));}
else console.log('Private-source scan skipped: the maintainer instruction package is unavailable on this host.');
const problems=[];
for(const file of files){
  if(file.startsWith('.agent/')||file.startsWith('node_modules/')||/^\.env(?:\.|$)/.test(file))problems.push(`${file}: prohibited public path`);
  const data=revision?execFileSync('git',['show',`${revision}:${file}`],{maxBuffer:8*1024*1024}):readFileSync(file);
  if(data.includes(0))continue;
  const text=data.toString('utf8').replaceAll('Ding Ding Projects','');
  if(matchers.some(m=>{m.lastIndex=0;return m.test(text)}))problems.push(`${file}: private wording requires review`);
  if(/[A-Z]:[\\/]Users[\\/]/i.test(text))problems.push(`${file}: local machine path`);
}
if(problems.length){console.error(problems.join('\n'));process.exit(1)}
console.log(`Public-source scan passed for ${files.length} tracked paths${revision?' at '+revision:''}.`);
