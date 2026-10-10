import {synchronizeSearchState,type SearchState} from '../../workers/regex-workbench-worker';
export const companionSearchScopes=['catalog','models','records'] as const;
export type CompanionSearchScope=typeof companionSearchScopes[number];
export function createCompanionSearchStates(){return Object.fromEntries(companionSearchScopes.map(scope=>[scope,{mode:'literal',query:'',pattern:'',flags:'i'}])) as Record<CompanionSearchScope,SearchState>}
export function updateCompanionSearch(states:Record<CompanionSearchScope,SearchState>,scope:CompanionSearchScope,patch:Partial<SearchState>){if(!companionSearchScopes.includes(scope))throw Error('Unknown companion search scope');return {...states,[scope]:synchronizeSearchState(states[scope],patch)}}
export type CompanionWorkbenchPort={getSearchState:()=>SearchState;setSearchState:(state:Partial<SearchState>)=>void};
/** Use the workbench API so old results, workers and validity are invalidated. */
export function forwardCompanionSearch(workbench:CompanionWorkbenchPort,state:SearchState,suppress:(active:boolean)=>void){suppress(true);try{workbench.setSearchState(state)}finally{suppress(false)}}
/** Filtering emits indices only; no samples or captures leave the transient worker. */
export function filterCompanionValues(values:string[],state:SearchState){
 if(!['literal','regex'].includes(state.mode)||values.length>100000||state.pattern.length>2048||state.query.length>2048||state.flags.length>8||values.reduce((total,value)=>total+value.length,0)>16*1024*1024)throw Error('Search bound exceeded');
 const synchronized=synchronizeSearchState(state,{});if(synchronized.pattern.length>2048)throw Error('Search bound exceeded');const expression=new RegExp(synchronized.pattern,synchronized.flags);
 return values.flatMap((value,index)=>{expression.lastIndex=0;return expression.test(value)?[index]:[]});
}
