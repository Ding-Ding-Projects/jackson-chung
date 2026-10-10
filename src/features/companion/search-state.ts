import {synchronizeSearchState,type SearchState} from '../../workers/regex-workbench-worker';
export const companionSearchScopes=['catalog','models','records'] as const;
export type CompanionSearchScope=typeof companionSearchScopes[number];
export function createCompanionSearchStates(){return Object.fromEntries(companionSearchScopes.map(scope=>[scope,{mode:'literal',query:'',pattern:'',flags:'i'}])) as Record<CompanionSearchScope,SearchState>}
export function updateCompanionSearch(states:Record<CompanionSearchScope,SearchState>,scope:CompanionSearchScope,patch:Partial<SearchState>){if(!companionSearchScopes.includes(scope))throw Error('Unknown companion search scope');return {...states,[scope]:synchronizeSearchState(states[scope],patch)}}
/** Filtering emits indices only; no samples or captures leave the transient worker. */
export function filterCompanionValues(values:string[],state:SearchState){
 if(!['literal','regex'].includes(state.mode)||values.length>100000||state.pattern.length>2048||state.query.length>2048||state.flags.length>8||values.reduce((total,value)=>total+value.length,0)>16*1024*1024)throw Error('Search bound exceeded');new RegExp('',state.flags);
 const expression=state.mode==='regex'?new RegExp(state.pattern,state.flags):null;const insensitive=state.flags.includes('i');
 return values.flatMap((value,index)=>{let match;if(expression){expression.lastIndex=0;match=expression.test(value)}else match=insensitive?value.toLowerCase().includes(state.query.toLowerCase()):value.includes(state.query);return match?[index]:[]});
}
