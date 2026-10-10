import type { Locale } from '../types';
export type Settings = {
  version: 1; locale: Locale; funnyEn: number; funnyYue: number; emojis: boolean;
  theme: 'system'|'light'|'dark'; density: 'comfortable'|'compact'; font: 'system'|'serif'|'mono'; fontSize: number;
  seed: string; reducedMotion: boolean; displayName: string; narration: boolean; voiceEn: string; voiceYue: string; rate: number; pitch: number;
  dock: 'top'|'bottom'; pins: string[]; focus: boolean; lowStimulation: boolean; timeAwareness: boolean; oneThing: boolean; momentum: boolean;
};
export const defaults: Settings = {version:1,locale:'en',funnyEn:5,funnyYue:5,emojis:true,theme:'system',density:'comfortable',font:'system',fontSize:16,seed:'#006b60',reducedMotion:false,displayName:'Jackson Chung',narration:false,voiceEn:'',voiceYue:'',rate:1,pitch:1,dock:'top',pins:[],focus:false,lowStimulation:false,timeAwareness:false,oneThing:false,momentum:false};
const key='jc.settings.v1', historyKey='jc.history.v1';
export type Revision = {id:string; at:string; action:string; settings:Settings};
let state: Settings = structuredClone(defaults);
let revisions: Revision[]=[];
let persistenceError='';
export function validateSettings(value: unknown): Settings {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw Error('Expected a settings object.');
  const v=value as Record<string,unknown>;
  if(Object.keys(v).some(k=>!(k in defaults)) || Object.keys(defaults).some(k=>!(k in v))) throw Error('Unexpected or missing settings fields.');
  for(const k of Object.keys(defaults) as (keyof Settings)[]) if(typeof v[k]!==typeof defaults[k]) throw Error(`Invalid ${k}.`);
  if(v.version!==1 || !['en','yue','both'].includes(String(v.locale)) || !['system','light','dark'].includes(String(v.theme)) || !['comfortable','compact'].includes(String(v.density)) || !['system','serif','mono'].includes(String(v.font)) || !['top','bottom'].includes(String(v.dock))) throw Error('Unsupported settings value.');
  for(const [k,min,max] of [['funnyEn',1,5],['funnyYue',1,5],['fontSize',12,24],['rate',0.5,2],['pitch',0,2]] as const) if(!Number.isFinite(v[k]) || Number(v[k])<min || Number(v[k])>max) throw Error(`Invalid ${k} range.`);
  if(!/^#[0-9a-f]{6}$/i.test(String(v.seed)) || String(v.displayName).length>80 || String(v.voiceEn).length>300 || String(v.voiceYue).length>300 || !Array.isArray(v.pins) || v.pins.length>30 || v.pins.some(x=>typeof x!=='string'||! /^[a-z0-9-]{1,60}$/.test(x))) throw Error('Invalid appearance or navigation value.');
  return structuredClone(v) as Settings;
}
try { const cached=localStorage.getItem(key); if(cached) state=validateSettings(JSON.parse(cached)); const h=JSON.parse(localStorage.getItem(historyKey)||'[]'); if(Array.isArray(h)) revisions=h.slice(-100).filter(r=>r && typeof r.id==='string' && typeof r.at==='string' && typeof r.action==='string').map(r=>({...r,settings:validateSettings(r.settings)})); } catch { persistenceError='Stored settings could not be read. Defaults are active.'; }
const listeners=new Set<()=>void>();
export function getState(): Settings {return structuredClone(state);}
export function getHistory(): Revision[] {return structuredClone(revisions);}
export function getPersistenceError(){return persistenceError;}
export function subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);}
export function updateState(patch:Partial<Settings>, action='Settings changed') {
 const next=validateSettings({...state,...patch}); if(JSON.stringify(next)===JSON.stringify(state)) return;
 state=next; revisions.push({id:crypto.randomUUID(),at:new Date().toISOString(),action,settings:getState()}); revisions=revisions.slice(-100);
 try{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem(historyKey,JSON.stringify(revisions));persistenceError='';}catch{persistenceError='Storage is unavailable or full. This change lasts only in this tab.';}
 applyAppearance();listeners.forEach(f=>f());window.dispatchEvent(new CustomEvent('jc-state',{detail:getState()}));
}
export function restoreRevision(id:string){const r=revisions.find(r=>r.id===id);if(r)updateState(r.settings,'Restored settings revision');}
export function resetSettings(){updateState(structuredClone(defaults),'Reset settings');}
export function applyAppearance(){const s=state,r=document.documentElement; r.dataset.theme=s.theme;r.dataset.density=s.density;r.dataset.motion=(s.reducedMotion||s.lowStimulation)?'reduced':'normal';r.style.colorScheme=s.theme==='system'?'light dark':s.theme;r.style.setProperty('--md-sys-color-primary',s.seed);r.style.setProperty('--jc-font-size',`${s.fontSize}px`);r.style.fontSize=`${s.fontSize}px`;r.style.fontFamily=s.font==='serif'?'Georgia,serif':s.font==='mono'?'ui-monospace,monospace':'system-ui,sans-serif';}
window.addEventListener('storage',e=>{if(e.key===key && e.newValue){try{state=validateSettings(JSON.parse(e.newValue));applyAppearance();listeners.forEach(f=>f());window.dispatchEvent(new CustomEvent('jc-state',{detail:getState()}));}catch{persistenceError='Another tab supplied invalid settings; the current settings were kept.';}}});
export function translate(en:string,yue:string,locale=state.locale){const text=locale==='en'?en:locale==='yue'?yue:`${en} · ${yue}`;return personalText(text);}
let mappings: Array<{original:string;replacement:string}>=[];
const vocabularyKey='jc.private-words.v1';
// Parse duplicate object keys before JSON.parse can erase them.
export function parseUniqueJson(text:string): unknown {
 let i=0; const ws=()=>{while(/\s/.test(text[i]||'')&&i<text.length)i++;};
 const string=()=>{const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')return JSON.parse(text.slice(start,i)) as string;}throw Error('Unterminated JSON string.');};
 const value=(depth:number):void=>{if(depth>8)throw Error('JSON nesting exceeds eight levels.');ws();if(text[i]==='{'){i++;ws();const keys=new Set();if(text[i]==='}'){i++;return;}while(i<text.length){ws();if(text[i]!=='"')throw Error('Expected object key.');const k=string();if(keys.has(k)||['__proto__','constructor','prototype'].includes(k))throw Error('Duplicate or unsafe object key.');keys.add(k);ws();if(text[i++]!==':')throw Error('Expected colon.');value(depth+1);ws();const c=text[i++];if(c==='}')return;if(c!==',')throw Error('Expected comma.');}}else if(text[i]==='['){i++;ws();if(text[i]===']'){i++;return;}while(i<text.length){value(depth+1);ws();const c=text[i++];if(c===']')return;if(c!==',')throw Error('Expected comma.');}}else if(text[i]==='"'){string();}else{const m=/^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));if(!m)throw Error('Invalid JSON value.');i+=m[0].length;}};
 value(0);ws();if(i!==text.length)throw Error('Unexpected trailing JSON.');return JSON.parse(text);
}
export function validateVocabulary(text:string){if(new TextEncoder().encode(text).length>262144)throw Error('File exceeds 256 KiB.');const v=parseUniqueJson(text) as {version:unknown;entries:unknown};if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='entries,version'||v.version!==1||!Array.isArray(v.entries)||v.entries.length>1000)throw Error('Expected version 1 and at most 1000 entries.');const seen=new Set<string>();return v.entries.map(e=>{if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).sort().join(',')!=='original,replacement'||typeof e.original!=='string'||typeof e.replacement!=='string'||!e.original.trim()||e.original.length>160||!e.replacement.trim()||e.replacement.length>160||/[\u0000-\u001f\u007f]/.test(e.original+e.replacement)||seen.has(e.original))throw Error('Invalid or duplicate replacement entry.');seen.add(e.original);return{original:e.original,replacement:e.replacement};});}
export function loadVocabulary(text:string){const valid=validateVocabulary(text);localStorage.setItem(vocabularyKey,JSON.stringify({version:1,entries:valid}));mappings=valid;listeners.forEach(f=>f());window.dispatchEvent(new CustomEvent('jc-state',{detail:getState()}));}
export function clearVocabulary(){localStorage.removeItem(vocabularyKey);mappings=[];listeners.forEach(f=>f());window.dispatchEvent(new CustomEvent('jc-state',{detail:getState()}));}
export function hasVocabulary(){return mappings.length>0;}
export function personalText(text:string){if(!mappings.length)return text;const sorted=[...mappings].sort((a,b)=>b.original.length-a.original.length);const escaped=sorted.map(x=>x.original.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));return text.replace(new RegExp(escaped.join('|'),'gu'),match=>sorted.find(x=>x.original===match)!.replacement);}
try{const cached=localStorage.getItem(vocabularyKey);if(cached)mappings=validateVocabulary(cached);}catch{try{localStorage.removeItem(vocabularyKey);}catch{/* Storage can be disabled. */}}
export function exportSettings(){return JSON.stringify({version:1,settings:getState(),history:getHistory(),omitted:['Personal wording and file metadata']},null,2);}
export function downloadText(name:string,text:string,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type:`${type};charset=utf-8`}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
