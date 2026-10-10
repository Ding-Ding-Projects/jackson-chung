import './local-search';
import {LitElement,html,css} from 'lit';
import type {FeatureRegistry,FeatureDefinition} from '../../types';
import {translate as t} from '../../state/store';
export const SEARCH_WORKER_LIMITS={startupMs:2000,evaluationMs:150,query:1000,items:1000,itemCharacters:10000} as const;
export function matchInWorker(query:string,flags:string,values:string[],signal?:AbortSignal):Promise<number[]>{return new Promise((resolve,reject)=>{
 if(typeof query!=='string'||typeof flags!=='string'||!Array.isArray(values)||query.length>SEARCH_WORKER_LIMITS.query||values.length>SEARCH_WORKER_LIMITS.items||values.some(value=>typeof value!=='string'||value.length>SEARCH_WORKER_LIMITS.itemCharacters)){reject(Error('Search limits exceeded.'));return;}
 if(signal?.aborted){reject(new DOMException('Search canceled.','AbortError'));return;}
 let worker:Worker|undefined,url:string|undefined,timer:ReturnType<typeof setTimeout>|undefined,settled=false,ready=false;
 const finish=(error?:Error,indices?:number[])=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();}if(url)URL.revokeObjectURL(url);error?reject(error):resolve(indices!);};
 const abort=()=>finish(new DOMException('Search canceled.','AbortError'));
 try{
  const source=`onmessage=e=>{try{const {query,flags,values}=e.data;const re=new RegExp(query,flags);postMessage({type:'result',indices:values.flatMap((value,index)=>{re.lastIndex=0;return re.test(value)?[index]:[]})})}catch{postMessage({type:'error',code:'syntax'})}};postMessage({type:'ready'});`;
  url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(url);signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>finish(Error('Search worker startup exceeded 2000 ms.')),SEARCH_WORKER_LIMITS.startupMs);
  worker.onmessage=event=>{const data=event.data;if(!data||typeof data!=='object'||Array.isArray(data)){finish(Error('Invalid search worker response.'));return;}
   if(!ready){if(data.type!=='ready'||Object.keys(data).join(',')!=='type'){finish(Error('Invalid search worker startup response.'));return;}ready=true;clearTimeout(timer);timer=setTimeout(()=>finish(Error('Pattern evaluation exceeded 150 ms.')),SEARCH_WORKER_LIMITS.evaluationMs);try{worker!.postMessage({query,flags,values});}catch{finish(Error('Search request could not be sent.'));}return;}
   if(data.type==='error'&&data.code==='syntax'&&Object.keys(data).sort().join(',')==='code,type'){finish(Error('Invalid regular expression.'));return;}
   if(data.type!=='result'||Object.keys(data).sort().join(',')!=='indices,type'||!Array.isArray(data.indices)||data.indices.length>values.length||data.indices.some((index:unknown,position:number)=>!Number.isInteger(index)||Number(index)<0||Number(index)>=values.length||(position>0&&Number(index)<=data.indices[position-1]))){finish(Error('Invalid search worker result.'));return;}finish(undefined,data.indices);
  };
  worker.onerror=()=>finish(Error('Search worker unavailable.'));worker.onmessageerror=()=>finish(Error('Search worker response could not be decoded.'));if(signal?.aborted)abort();
 }catch{finish(Error('Search worker could not start.'));}
});}
const definitions:FeatureDefinition[]=[];
export function indexDestinations(items:FeatureDefinition[]){definitions.splice(0,definitions.length,...items);window.dispatchEvent(new CustomEvent('jc-search-index'));}
class SearchTools extends LitElement {
 static styles=css`:host{display:block;min-width:0}section{padding:20px;border:1px solid var(--md-sys-color-outline-variant,#bdccc5);border-radius:24px;margin:16px 0}p{overflow-wrap:anywhere;line-height:1.6}`;
 private results:FeatureDefinition[]=[];private searchInstance=crypto.randomUUID();private refresh=()=>this.requestUpdate();
 connectedCallback(){super.connectedCallback();window.addEventListener('jc-search-index',this.refresh);}disconnectedCallback(){window.removeEventListener('jc-search-index',this.refresh);super.disconnectedCallback();}
 render(){return html`<h1>${t('Search and commands','搜尋及指令')}</h1><section><jc-local-search .fieldId=${`destinations.${this.searchInstance}`} .scope=${t('Search destinations','搜尋目的地')} .items=${definitions.map(item=>`${item.title.en} ${item.title.yue} ${item.group}`)} @jc-filter=${(event:CustomEvent)=>{this.results=event.detail.indices.map((index:number)=>definitions[index]).filter(Boolean);this.requestUpdate();}}></jc-local-search><p role="status">${t(`${this.results.length} destinations match.`,`${this.results.length} 個目的地符合。`)}</p>${this.results.map(item=>html`<p><md-outlined-button @click=${()=>window.dispatchEvent(new CustomEvent('jc-navigate',{detail:item.id}))}>${t(item.title.en,item.title.yue)}</md-outlined-button> ${item.group}</p>`)}</section><p>${t('Only registered destinations are indexed. Rich inline setting results, exact-element teleport and bulk result actions remain incomplete.','只索引已登記目的地。行內設定、精確元素跳轉及批量結果操作尚未完成。')}</p>`;}
}
customElements.define('jc-search-tools',SearchTools);
export function registerSearch(registry:FeatureRegistry){registry.register({id:'search',title:{en:'Search and commands',yue:'搜尋及指令'},group:'Workspace',render:()=>html`<jc-search-tools></jc-search-tools>`});}
