export const QUEUE_DB='jc-conversion-queue-v1';
const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const completed=transaction=>new Promise((resolve,reject)=>{transaction.oncomplete=resolve;transaction.onabort=()=>reject(transaction.error??new Error('Storage transaction aborted.'));transaction.onerror=()=>reject(transaction.error);});
export async function openQueue(factory=globalThis.indexedDB){
  if(!factory)throw new Error('Durable browser storage is unavailable.');
  const request=factory.open(QUEUE_DB,1);request.onupgradeneeded=()=>{const db=request.result;const jobs=db.createObjectStore('jobs',{keyPath:'id',autoIncrement:true});jobs.createIndex('state','state');db.createObjectStore('files');db.createObjectStore('control');};return requestResult(request);
}
export class ConversionQueue {
  constructor(db,{estimate=()=>globalThis.navigator?.storage?.estimate?.(),limit=20*1024*1024}={}){this.db=db;this.estimate=estimate;this.limit=limit;}
  async add(file,operation,options={}){
    if(!file.size||file.size>this.limit)throw new Error('Each file must be nonempty and at most 20 MiB.');
    const capacity=await this.estimate();if(!capacity||!Number.isFinite(capacity.quota)||!Number.isFinite(capacity.usage))throw new Error('Browser storage capacity could not be verified. Durable queue intake is unavailable.');
    if(capacity.quota-capacity.usage<file.size*3+1048576)throw new Error('Insufficient estimated storage for source and validated output.');
    const transaction=this.db.transaction(['jobs','files'],'readwrite'),done=completed(transaction);
    const id=await requestResult(transaction.objectStore('jobs').add({state:'queued',operation,options,progress:0,size:file.size,created:Date.now(),attempts:0}));
    transaction.objectStore('files').put(file,id);await done;return id;
  }
  async page(after=0,count=20){
    if(!Number.isInteger(count)||count<1||count>50)throw new Error('Queue pages contain 1 to 50 records.');
    const transaction=this.db.transaction('jobs'),store=transaction.objectStore('jobs'),request=store.openCursor();const rows=[];
    return new Promise((resolve,reject)=>{request.onerror=()=>reject(request.error);request.onsuccess=()=>{const cursor=request.result;if(!cursor||rows.length===count){resolve(rows);return;}if(cursor.key>after)rows.push(cursor.value);cursor.continue();};});
  }
  async update(id,patch){const transaction=this.db.transaction('jobs','readwrite'),done=completed(transaction),store=transaction.objectStore('jobs');const job=await requestResult(store.get(id));if(!job)throw new Error('Queue job no longer exists.');store.put({...job,...patch});await done;}
  async setPaused(value){const transaction=this.db.transaction('control','readwrite'),done=completed(transaction);transaction.objectStore('control').put(Boolean(value),'paused');await done;}
  async paused(){return Boolean(await requestResult(this.db.transaction('control').objectStore('control').get('paused')));}
  async next(){return requestResult(this.db.transaction('jobs').objectStore('jobs').index('state').get('queued'));}
  async source(id){return requestResult(this.db.transaction('files').objectStore('files').get(id));}
  async cancel(id){const transaction=this.db.transaction(['jobs','files'],'readwrite'),done=completed(transaction),store=transaction.objectStore('jobs');const job=await requestResult(store.get(id));if(job)store.put({...job,state:'canceled',progress:0});transaction.objectStore('files').delete(id);await done;}
  async finish(id,result){const transaction=this.db.transaction(['jobs','files'],'readwrite'),done=completed(transaction),store=transaction.objectStore('jobs');const job=await requestResult(store.get(id));if(job&&job.state!=='canceled'){store.put({...job,state:'complete',progress:100});transaction.objectStore('files').put(result,id);}await done;}
  async recover(){
    const transaction=this.db.transaction('jobs','readwrite'),done=completed(transaction),request=transaction.objectStore('jobs').index('state').openCursor('running');
    request.onsuccess=()=>{const cursor=request.result;if(cursor){cursor.update({...cursor.value,state:cursor.value.attempts>=3?'failed':'queued',progress:0,recovered:true});cursor.continue();}};await done;
  }
  async remove(id){const transaction=this.db.transaction(['jobs','files'],'readwrite'),done=completed(transaction);transaction.objectStore('jobs').delete(id);transaction.objectStore('files').delete(id);await done;}
}
