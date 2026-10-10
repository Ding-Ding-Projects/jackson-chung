import {filterCompanionValues} from './search-state';
import type {SearchState} from '../../workers/regex-workbench-worker';
self.onmessage=(event:MessageEvent<{values:string[];state:SearchState}>)=>{try{self.postMessage({indices:filterCompanionValues(event.data.values,event.data.state),error:null});}catch{self.postMessage({indices:[],error:'Invalid expression or search bound exceeded'});}};
