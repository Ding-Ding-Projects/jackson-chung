import {getSchoolState} from '../../state/school';
import {getState} from '../../state/store';
type Event = {en:string;yue:string;category:string;error?:boolean};
let pending:Event[]=[];let active=false;let timer:ReturnType<typeof setTimeout>|undefined;
const last=new Map<string,number>();
let screenReaderMode=false;
export function setScreenReaderMode(enabled:boolean){screenReaderMode=enabled;if(enabled)stopNarration();}
export function stopNarration(){pending=[];active=false;if(timer)clearTimeout(timer);window.speechSynthesis?.cancel();}
export function narrateEvent(event:Event){const state=getState();if(!state.narration||screenReaderMode||!window.speechSynthesis)return;const now=Date.now();if(!event.error&&now-(last.get(event.category)||0)<3000)return;last.set(event.category,now);pending=pending.filter(e=>e.category!==event.category);pending.push(event);if(pending.length>20)pending=pending.slice(-20);if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=undefined;drain();},event.error?0:250);}
function drain(){if(active||!pending.length||!getState().narration||screenReaderMode)return;active=true;const event=pending.shift()!;const state=getState();const languages=getSchoolState().enabled?['en']:state.locale==='both'?['en','yue']: [state.locale];let index=0;
 const next=()=>{if(!getState().narration||screenReaderMode){active=false;return;}if(index>=languages.length){active=false;drain();return;}const language=languages[index++];const voices=window.speechSynthesis.getVoices().filter(v=>language==='en'?v.lang.startsWith('en'):/^(yue|zh-HK)/i.test(v.lang));const voice=voices.find(v=>v.voiceURI===(language==='en'?state.voiceEn:state.voiceYue))||voices[0];if(!voice){next();return;}const utterance=new SpeechSynthesisUtterance(language==='en'?event.en:event.yue);utterance.voice=voice;utterance.rate=state.rate;utterance.pitch=state.pitch;utterance.onend=next;utterance.onerror=next;window.speechSynthesis.speak(utterance);};next();
}
window.addEventListener('jc-narrate',e=>{const detail=(e as CustomEvent).detail;if(detail&&typeof detail.en==='string'&&typeof detail.yue==='string'&&typeof detail.category==='string'&&detail.en.length<4000&&detail.yue.length<4000)narrateEvent(detail);});
window.addEventListener('jc-state',()=>{if(!getState().narration)stopNarration();});
