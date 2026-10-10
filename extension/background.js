const allowed=new Set(['ollama.tags','ollama.ps','ollama.catalog','ollama.catalog.refresh','ollama.hardware','ollama.model','ollama.chat','ollama.pull','task.poll','task.cancel']);
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  let url;try{url=new URL(sender.url)}catch{return false}
  if(url.origin!=='https://ding-ding-projects.github.io'||!url.pathname.startsWith('/jackson-chung/')||sender.frameId!==0||!allowed.has(message.operation))return false;
  if(JSON.stringify(message).length>1000000){respond({ok:false,error:'Request too large'});return false}
  chrome.storage.session.get('pairing').then(({pairing})=>{if(!pairing){respond({ok:false,error:'Open the extension and pair with the companion first'});return}chrome.runtime.sendNativeMessage('org.jacksonchung.companion',{id:crypto.randomUUID(),timestamp:Date.now(),origin:url.href,token:pairing,operation:message.operation,input:message.input},response=>{respond(chrome.runtime.lastError?{ok:false,error:'Native host unavailable. Install and start the companion.'}:response)})});return true;
});
