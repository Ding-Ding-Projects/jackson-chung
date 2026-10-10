import {readFileSync,existsSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('../contracts/required-contracts.json',import.meta.url),'utf8'));
export function validateInventory(inventory){
 if(inventory.schemaVersion!==1||!Array.isArray(inventory.required)||new Set(inventory.required).size!==inventory.required.length)throw Error('Invalid required contract inventory.');
 if(JSON.stringify([...inventory.required].sort())!==JSON.stringify([...baseline.ids].sort()))throw Error('Required contract inventory differs from the independently retained baseline.');
 if(JSON.stringify([...(inventory.surfaces||[])].sort())!==JSON.stringify([...baseline.surfaces].sort()))throw Error('Required surface inventory differs from the retained baseline.');
 if(!Array.isArray(inventory.rows))throw Error('Missing feature evidence rows.');
 const failures=[];
 for(const id of inventory.required){
  if(inventory.scopeNotes?.[id])continue;
  for(const surface of inventory.surfaces){
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
