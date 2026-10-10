import {readFileSync,existsSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('../contracts/required-contracts.json',import.meta.url),'utf8'));
export function validateInventory(inventory){
 if(inventory.schemaVersion!==1||!Array.isArray(inventory.required)||new Set(inventory.required).size!==inventory.required.length)throw Error('Invalid required contract inventory.');
 if(JSON.stringify([...inventory.required].sort())!==JSON.stringify([...baseline.ids].sort()))throw Error('Required contract inventory differs from the independently retained baseline.');
 if(JSON.stringify([...(inventory.surfaces||[])].sort())!==JSON.stringify([...baseline.surfaces].sort()))throw Error('Required surface inventory differs from the retained baseline.');
 if(!Array.isArray(inventory.rows))throw Error('Missing feature evidence rows.');
 const notes=inventory.scopeNotes??{};
 if(typeof notes!=='object'||Array.isArray(notes)||Object.entries(notes).some(([id,reason])=>!baseline.allowedGlobalScopeNotes.includes(id)||typeof reason!=='string'||!reason.trim()))throw Error('Invalid global scope note.');
 const exceptions=inventory.surfaceExceptions??[];
 if(!Array.isArray(exceptions))throw Error('Invalid surface exceptions.');
 const excluded=new Set();
 for(const exception of exceptions){
  if(!exception||JSON.stringify(Object.keys(exception).sort())!==JSON.stringify(['basis','documentation','id','reason','surface'].sort()))throw Error('Invalid surface exception fields.');
  const {id,surface,basis,documentation,reason}=exception;
  if(!baseline.ids.includes(id)||!baseline.surfaces.includes(surface)||typeof reason!=='string'||!reason.trim()||reason.length>1000||!baseline.allowedSurfaceExceptions.some(allowed=>allowed.id===id&&allowed.surface===surface&&allowed.basis===basis&&allowed.documentation===documentation)||!existsSync(documentation))throw Error('Unauthorized or undocumented surface exception.');
  const pair=`${surface}/${id}`;
  if(excluded.has(pair))throw Error('Duplicate surface exception.');
  excluded.add(pair);
 }
 const failures=[];
 for(const id of inventory.required){
  if(notes[id])continue;
  for(const surface of inventory.surfaces){
   if(excluded.has(`${surface}/${id}`))continue;
   const row=inventory.rows.find(r=>r.id===id&&r.surface===surface);
   if(!row){failures.push(`${surface}/${id}: missing inventory row`);continue;}
   for(const key of ['implementation','documentation','localization','test','negativeRegression','interaction','capture'])if(!row[key]||!existsSync(row[key]))failures.push(`${surface}/${id}: missing ${key}`);
   if(row.state!=='verified')failures.push(`${surface}/${id}: not verified`);
  }
 }
 return failures;
}
if(process.argv[1]?.endsWith('check-contracts.mjs')){
 const inventory=JSON.parse(readFileSync('contracts/features.json','utf8'));const failures=validateInventory(inventory);
 if(failures.length){console.error(`Contract completeness remains incomplete: ${failures.length} missing or unverified requirements.`);console.error(failures.slice(0,15).join('\n'));process.exit(1)}
 console.log('All applicable surface contracts have verified evidence.');
}
