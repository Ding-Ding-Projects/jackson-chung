import {LitElement,html,css} from 'lit';
import type {FeatureRegistry,FeatureContext,NativeApi} from '../../types';

/** Browser transport has no local-network access and receives no pairing material. */
export function browserAdapter(): NativeApi {
  return {
    capabilities:async()=>({version:'extension',capabilities:['ollama']}),
    request:(operation,input)=>new Promise(resolve=>{
      const id=crypto.randomUUID();
      const timer=setTimeout(()=>{window.removeEventListener('message',listener);resolve({ok:false,error:'Install and pair the optional browser extension, then retry.'});},16000);
      const listener=(event:MessageEvent)=>{if(event.source!==window||event.origin!==location.origin||event.data?.source!=='jackson-companion-extension'||event.data.id!==id)return;clearTimeout(timer);window.removeEventListener('message',listener);resolve(event.data.result);};
      window.addEventListener('message',listener);
      window.postMessage({source:'jackson-companion-page',id,operation,input},location.origin);
    })
  };
}
class CompanionPanel extends LitElement {
  static properties={context:{attribute:false},status:{state:true},models:{state:true},output:{state:true},busy:{state:true},pairing:{state:true},revisions:{state:true},capabilities:{state:true}};
  context!:FeatureContext;
  status=''; models:string[]=[]; output=''; busy=false; pairing='';revisions:{id:string;date:string;label:string}[]=[];capabilities='';
  private taskIds=new Set<string>();private stopped=false;
  static styles=css`:host{display:block}section{display:grid;gap:1rem;max-width:72rem}fieldset{min-width:0;border:1px solid var(--md-sys-color-outline,#777);border-radius:16px;padding:1rem;display:grid;gap:.75rem}label{display:grid;gap:.4rem}input,textarea,select,button{font:inherit;color:inherit;background:var(--md-sys-color-surface-container,#eee);border:1px solid var(--md-sys-color-outline,#777);border-radius:12px;padding:.75rem;box-sizing:border-box;max-width:100%}textarea{min-height:6rem}button{cursor:pointer;min-height:44px}nav,.actions{display:flex;gap:.5rem;flex-wrap:wrap}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:28rem;overflow:auto}output{overflow-wrap:anywhere}ul{padding-inline-start:1.2rem}a{color:var(--md-sys-color-primary,#315da8)}`;
  private t(en:string,yue:string){return this.context?.translate(en,yue)??en}
  private get api(){return this.context?.native??window.jacksonNative??browserAdapter()}
  private async request(op:string,input?:unknown){const result=await this.api.request(op,input);if(!result.ok)throw Error(result.error??'Unavailable');return result.value as any}
  private async action(work:()=>Promise<void>){try{await work();}catch(e){this.status=e instanceof Error?e.message:'Unavailable';this.context?.notify(this.status,'error')}}
  connectedCallback(){super.connectedCallback();this.stopped=false}
  disconnectedCallback(){this.stopped=true;for(const id of this.taskIds)void this.api.request('task.cancel',{id});super.disconnectedCallback()}
  private value(id:string){return (this.renderRoot.querySelector('#'+id) as HTMLInputElement)?.value??''}
  private async refresh(){await this.action(async()=>{const result=await this.request('ollama.tags');this.models=(result.models??[]).map((m:any)=>String(m.name));const running=await this.request('ollama.ps');const names=(running.models??[]).map((m:any)=>String(m.name)).join(', ');this.status=this.t(`Installed: ${this.models.length}. Running: ${names||'none'}.`,`已安裝：${this.models.length}。執行中：${names||'冇'}。`)})}
  private async stream(operation:string,input:unknown){const {id}=await this.request(operation,input);this.taskIds.add(id);this.busy=true;try{while(!this.stopped){const result=await this.request('task.poll',{id});for(const chunk of result.chunks??[]){this.output+=chunk.message?.content??(chunk.status?`${chunk.status}${chunk.total?` ${chunk.completed??0}/${chunk.total}`:''}\n`:'');}if(result.done){if(result.error)throw Error(result.error);break}await new Promise(resolve=>setTimeout(resolve,250))}}finally{this.taskIds.delete(id);this.busy=this.taskIds.size>0}}
  render(){const native=!!(this.context?.native??window.jacksonNative);return html`<section>
    <h2>${this.t('Local companion','本機助手')}</h2>
    <p>${this.t('The website works without the companion. Native dialogs, encrypted local storage and local models need the optional desktop companion. Browser model requests require the paired extension.','網站毋須助手亦可使用。本機對話框、加密儲存同本機模型需要選用桌面助手。瀏覽器模型請求需要已配對擴充功能。')}</p>
    ${native?html`<nav aria-label="Window actions"><button @click=${()=>this.action(async()=>{await this.request('window.minimize')})}>${this.t('Minimize','最小化')}</button><button @click=${()=>this.action(async()=>{await this.request('window.maximize')})}>${this.t('Maximize / restore','最大化／還原')}</button><button @click=${()=>this.action(async()=>{await this.request('window.close')})}>${this.t('Close','關閉')}</button></nav>`:''}
    <output role="status" aria-live="polite">${this.status}</output>
    <fieldset><legend>${this.t('Ollama local models','Ollama 本機模型')}</legend>
      <p>${this.t('Connects only to the local Ollama service. No hardware capacity is inferred. Install Ollama and start its service when unavailable.','只連接本機 Ollama 服務，唔會推測硬件容量。未能連接時請安裝 Ollama 並啟動服務。')}</p>
      <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">${this.t('Install Ollama','安裝 Ollama')}</a>
      <button @click=${()=>this.refresh()}>${this.t('Refresh installed models','重新讀取已安裝模型')}</button>
      <label>${this.t('Exact model identifier','完整模型識別碼')}<input id="model" list="models" placeholder="model:tag"><datalist id="models">${this.models.map(model=>html`<option value=${model}></option>`)}</datalist></label>
      <label>${this.t('Message','訊息')}<textarea id="prompt"></textarea></label>
      <div class="actions"><button ?disabled=${this.busy} @click=${()=>this.action(async()=>{this.output='';await this.stream('ollama.chat',{model:this.value('model'),prompt:this.value('prompt')})})}>${this.t('Send locally','本機傳送')}</button><button @click=${()=>{for(const id of this.taskIds)void this.api.request('task.cancel',{id})}}>${this.t('Cancel active tasks','取消執行中工作')}</button></div>
      <label>${this.t('Download models, one exact identifier per line','下載模型，每行一個完整識別碼')}<textarea id="pulls"></textarea></label>
      <button ?disabled=${this.busy} @click=${()=>this.action(async()=>{const names=[...new Set(this.value('pulls').split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];if(!names.length||names.length>20)throw Error(this.t('Enter 1 to 20 models.','請輸入 1 至 20 個模型。'));this.output='';for(const model of names){await this.stream('ollama.pull',{model});}await this.refresh()})}>${this.t('Download batch','批次下載')}</button>
      <p>${this.t('A complete official catalog API is unavailable. The official catalog is the authoritative list; enter its exact identifier here.','完整官方目錄 API 未提供。請以官方目錄為準，喺此輸入完整識別碼。')} <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">${this.t('Official catalog','官方目錄')}</a></p><pre aria-live="polite">${this.output}</pre>
    </fieldset>
    ${native?html`<fieldset><legend>${this.t('Encrypted local records and history','加密本機記錄同歷史')}</legend>
      <label>${this.t('History password, first unlock sets it locally','歷史密碼，首次解鎖會喺本機設定')}<input id="history-password" type="password" autocomplete="off" minlength="8"></label>
      <div class="actions"><button @click=${()=>this.action(async()=>{const field=this.renderRoot.querySelector('#history-password') as HTMLInputElement;const password=field.value;field.value='';await this.request('history.unlock',{password});this.status=this.t('History unlocked for five minutes.','歷史已解鎖五分鐘。')})}>${this.t('Unlock history','解鎖歷史')}</button><button @click=${()=>this.action(async()=>{await this.request('history.lock');this.revisions=[];this.status=this.t('History locked.','歷史已鎖定。')})}>${this.t('Lock history','鎖定歷史')}</button></div>
      <button @click=${()=>this.action(async()=>{this.capabilities=JSON.stringify(await this.api.capabilities());})}>${this.t('Check native capability status','檢查本機功能狀態')}</button><output>${this.capabilities}</output>
      <label>${this.t('JSON records','JSON 記錄')}<textarea id="records">{}</textarea></label>
      <div class="actions"><button @click=${()=>this.action(async()=>{(this.renderRoot.querySelector('#records') as HTMLTextAreaElement).value=JSON.stringify(await this.request('store.read'),null,2)})}>${this.t('Load','載入')}</button><button @click=${()=>this.action(async()=>{const result=await this.request('store.write',{value:JSON.parse(this.value('records'))});this.status=result.historySaved?this.t('Encrypted save and local history recorded.','加密儲存同本機歷史已記錄。'):result.historyRecovery})}>${this.t('Save encrypted','加密儲存')}</button><button @click=${()=>this.action(async()=>{this.revisions=(await this.request('history.list')).revisions})}>${this.t('Browse revisions','瀏覽版本')}</button></div>
      <ul>${this.revisions.map(r=>html`<li>${r.date} ${r.label} <button @click=${()=>this.action(async()=>{await this.request('history.restore',{id:r.id});this.status=this.t('Restored as a new revision.','已還原為新版本。')})}>${this.t('Restore as new revision','還原為新版本')}</button></li>`)}</ul>
      <button @click=${()=>this.action(async()=>{const file=await this.request('file.import');if(!file.cancelled)(this.renderRoot.querySelector('#records') as HTMLTextAreaElement).value=file.text})}>${this.t('Import selected text file','匯入所選文字檔')}</button>
      <button @click=${()=>this.action(async()=>{const file=await this.request('file.export',{text:this.value('records')});if(!file.cancelled){this.status=file.name;await this.request('editor.open',{id:file.id})}})}>${this.t('Export and open in VS Code','匯出並用 VS Code 開啟')}</button>
    </fieldset><fieldset><legend>${this.t('Browser pairing','瀏覽器配對')}</legend><p>${this.t('Choose each capability. Grants last until the companion closes or you revoke them. Pairing values are private and must not be captured or shared.','逐項選擇功能。授權維持至助手關閉或撤銷。配對值屬私人資料，唔好截取或分享。')}</p>
      ${['ollama.tags','ollama.ps','ollama.catalog','ollama.chat','ollama.pull','task.poll','task.cancel'].map(c=>html`<label><input type="checkbox" name="grant" value=${c}>${c}</label>`)}
      <button @click=${()=>this.action(async()=>{const capabilities=Array.from(this.renderRoot.querySelectorAll<HTMLInputElement>('input[name=grant]:checked')).map(e=>e.value);this.pairing=(await this.request('pairing.create',{capabilities})).token})}>${this.t('Create selected grant','建立所選授權')}</button>
      <label>${this.t('Pairing value, paste only in the extension','配對值，只貼到擴充功能')}<input type="password" readonly .value=${this.pairing}></label>
      <button @click=${()=>this.action(async()=>{await this.request('pairing.revoke');this.pairing='';this.status=this.t('All native grants revoked.','所有本機授權已撤銷。')})}>${this.t('Revoke every grant','撤銷所有授權')}</button></fieldset>`:''}
  </section>`}
}
if(!customElements.get('jc-companion'))customElements.define('jc-companion',CompanionPanel);
export function registerFeature(registry:FeatureRegistry){registry.register({id:'companion',title:{en:'Local companion',yue:'本機助手'},group:'tools',render:context=>html`<jc-companion .context=${context}></jc-companion>`})}
