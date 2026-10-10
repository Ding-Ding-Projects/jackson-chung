type CloseDependencies={resolveDrafts:()=>Promise<boolean>;canDispose:()=>boolean;requestClose:()=>Promise<{ok:boolean}>};
/** The initiating close is deliberately outside ordinary operation counters. */
export function createCompanionClose(dependencies:CloseDependencies){
 let pending=false;
 return async():Promise<'requested'|'cancelled'|'busy'|'error'>=>{
  if(pending)return 'busy';pending=true;
  try{if(!await dependencies.resolveDrafts())return 'cancelled';if(!dependencies.canDispose())return 'busy';const result=await dependencies.requestClose();return result?.ok===true?'requested':'error';}catch{return 'error';}finally{pending=false;}
 };
}
