import {LitElement,html,css} from 'lit';
import {matchInWorker} from './index';
import {translate as t,subscribe,getState} from '../../state/store';
import {synchronizeSearchState,type SearchState} from '../../workers/regex-workbench-worker';
import '../../components/regex-workbench';
import type {RegexWorkbench} from '../../components/regex-workbench';
import type {FeatureContext} from '../../types';
export class LocalSearch extends LitElement {
 static properties={items:{attribute:false},scope:{type:String},fieldId:{type:String}};
 static styles=css`:host{display:block;min-width:0;max-width:100%}md-outlined-text-field{width:100%;min-width:0}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}p{line-height:1.5;overflow-wrap:anywhere}`;
 items:string[]=[];scope='';fieldId=`local-search-${crypto.randomUUID()}`;
 private searchState:SearchState={mode:'literal',query:'',pattern:'',flags:'i'};private resultCount:number|null=null;private invalid=false;private generation=0;private itemFingerprint='';private unsubscribe?:()=>void;
 connectedCallback(){super.connectedCallback();this.unsubscribe=subscribe(()=>this.requestUpdate());}disconnectedCallback(){this.unsubscribe?.();this.generation++;super.disconnectedCallback();}
 getSearchState(){return {...this.searchState};}
 setSearchState(patch:Partial<SearchState>){this.searchState=synchronizeSearchState(this.searchState,patch);this.renderRoot.querySelector<RegexWorkbench>('jc-regex-workbench')?.setSearchState(this.searchState);void this.search();this.requestUpdate();}
 private receive(event:CustomEvent){if(event.detail?.fieldId!==this.fieldId)return;const incoming=event.detail.state as SearchState;const changed=JSON.stringify(incoming)!==JSON.stringify(this.searchState);this.searchState=synchronizeSearchState(this.searchState,incoming);if(event.detail.error){this.invalid=true;this.generation++;this.requestUpdate();return;}if(changed||event.detail.valid)void this.search();this.requestUpdate();}
 private async search(){const generation=++this.generation;try{const indices=await matchInWorker(this.searchState.pattern,this.searchState.flags,this.items);if(generation!==this.generation)return;this.resultCount=indices.length;this.invalid=false;this.dispatchEvent(new CustomEvent('jc-filter',{detail:{indices,query:this.searchState.query,regex:this.searchState.mode==='regex',flags:this.searchState.flags},bubbles:true,composed:true}));}catch{if(generation!==this.generation)return;this.invalid=true;}this.requestUpdate();}
 updated(changed:Map<string,unknown>){if(changed.has('items')){const fingerprint=JSON.stringify(this.items);if(fingerprint!==this.itemFingerprint){this.itemFingerprint=fingerprint;void this.search();}}}
 private context():FeatureContext{return{locale:getState().locale,translate:t,notify:message=>this.dispatchEvent(new CustomEvent('jc-search-notice',{detail:{message},bubbles:true,composed:true})),navigate:id=>window.dispatchEvent(new CustomEvent('jc-navigate',{detail:id}))};}
 render(){const state=getState();return html`<jc-regex-workbench .state=${this.searchState} .fieldId=${this.fieldId} .context=${this.context()} .funnyEn=${state.funnyEn} .funnyYue=${state.funnyYue} @jc-regex-change=${(event:CustomEvent)=>this.receive(event)} @jc-regex-apply=${(event:CustomEvent)=>this.receive(event)}><md-outlined-text-field slot="search" data-primary-search="true" aria-label=${this.scope||t('Search this list','搜尋此清單')} label=${this.scope||t('Search this list','搜尋此清單')} .value=${this.searchState.query} @input=${(event:Event)=>this.setSearchState({query:(event.target as HTMLInputElement).value})}></md-outlined-text-field></jc-regex-workbench><div class="row"><md-outlined-button @click=${()=>this.setSearchState({query:'',pattern:''})}>${t('Clear search','清除搜尋')}</md-outlined-button><label><md-switch aria-label=${t('Use regular expression','使用正規表示式')} .selected=${this.searchState.mode==='regex'} @change=${(event:Event)=>this.setSearchState({mode:(event.target as HTMLElement & {selected:boolean}).selected?'regex':'literal'})}></md-switch>${t('Regular expression','正規表示式')}</label></div><p role="status">${this.invalid?t('Invalid or over-time pattern. Existing results were kept.','樣式無效或超時，保留現有結果。'):this.resultCount===null?'':t(`${this.resultCount} matches`,`${this.resultCount} 個符合`)}</p>`;}
}
customElements.define('jc-local-search',LocalSearch);
