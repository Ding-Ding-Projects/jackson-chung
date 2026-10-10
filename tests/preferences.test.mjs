import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const values=new Map();
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={addEventListener(){},dispatchEvent(){}};
globalThis.document={documentElement:{dataset:{},style:{setProperty(){}}}};
const source=ts.transpile(fs.readFileSync(new URL('../src/state/store.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext});
const store=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('defaults and settings validation reject unsupported or unsafe values',()=>{assert.equal(store.getState().funnyEn,5);assert.equal(store.getState().funnyYue,5);assert.throws(()=>store.validateSettings({...store.defaults,fontSize:Infinity}));assert.throws(()=>store.validateSettings({...store.defaults,seed:'url(fake)'}));assert.throws(()=>store.validateSettings({...store.defaults,pins:['../escape']}));assert.throws(()=>store.validateSettings({...store.defaults,unknown:true}));});
test('personal wording validates atomically and never enters exports or history',()=>{const neutral=JSON.stringify({schemaVersion:1,entries:{'Sample original':'Neutral replacement'}});store.loadVocabulary(neutral);assert.equal(store.personalText('Sample original'),'Sample original');store.setLocalAuthenticated(true);assert.equal(store.personalText('Sample original'),'Neutral replacement');assert.throws(()=>store.loadVocabulary('{"schemaVersion":1,"schemaVersion":1,"entries":{}}'));assert.equal(store.personalText('Sample original'),'Neutral replacement');assert.throws(()=>store.validateVocabulary(JSON.stringify({schemaVersion:2,entries:{}})));assert.throws(()=>store.validateVocabulary(JSON.stringify({schemaVersion:1,entries:{a:42}})));assert.throws(()=>store.validateVocabulary('{"schemaVersion":1,"entries":{},"__proto__":{}}'));store.updateState({fontSize:18},'Changed text size');assert.ok(!store.exportSettings().includes('Neutral replacement'));assert.ok(!JSON.stringify(store.getHistory()).includes('Sample original'));store.clearVocabulary();assert.equal(store.personalText('Sample original'),'Sample original');});
test('settings revisions are append-only and unchanged mutations make no revision',()=>{const before=store.getHistory().length;store.updateState({theme:'dark'},'Changed theme');const revision=store.getHistory().at(-1);store.updateState({theme:'light'},'Changed theme');store.restoreRevision(revision.id);assert.equal(store.getState().theme,'dark');assert.equal(store.getHistory().length,before+3);store.updateState({theme:'dark'});assert.equal(store.getHistory().length,before+3);});
test('unique JSON parser rejects nesting and malformed trailing content',()=>{assert.throws(()=>store.parseUniqueJson('[[[[[[[[[[0]]]]]]]]]]'));assert.throws(()=>store.parseUniqueJson('{"a":1,"a":2}'));assert.throws(()=>store.parseUniqueJson('true false'));assert.deepEqual(store.parseUniqueJson('{"a":[1,true,"x"]}'),{a:[1,true,'x']});});
test('personal wording supports canonical empty replacements without cascading',()=>{store.setLocalAuthenticated(true);store.loadVocabulary(JSON.stringify({schemaVersion:1,entries:{Alpha:'Beta',Beta:'Gamma',Remove:''}}));assert.equal(store.personalText('Alpha Beta Remove'),'Beta Gamma ');store.clearVocabulary();});

test('fractional humour values are rejected and translation falls back safely',()=>{assert.throws(()=>store.validateSettings({...store.defaults,funnyEn:2.5}));assert.throws(()=>store.validateSettings({...store.defaults,funnyYue:4.1}));assert.equal(store.translate(undefined,undefined),'');});
test('local authentication controls private replacement visibility',()=>{store.loadVocabulary(JSON.stringify({schemaVersion:1,entries:{Public:'Private choice'}}));store.setLocalAuthenticated(false);assert.equal(store.personalText('Public'),'Public');store.setLocalAuthenticated(true);assert.equal(store.personalText('Public'),'Private choice');store.setLocalAuthenticated(false);assert.equal(store.personalText('Public'),'Public');store.clearVocabulary();});
test('all four dock positions validate, left is the shipped default, and language follows state',()=>{assert.equal(store.defaults.dock,'left');for(const dock of ['left','right','top','bottom'])assert.equal(store.validateSettings({...store.defaults,dock}).dock,dock);store.updateState({locale:'yue'});assert.equal(document.documentElement.lang,'zh-HK');store.updateState({locale:'both'});assert.equal(document.documentElement.lang,'en');assert.equal(document.documentElement.dataset.locale,'both');});
test('local schedule boundaries use their starting weekday and preserve base settings',async()=>{
 const storeUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
 const litStub=`data:text/javascript;base64,${Buffer.from('export class LitElement{};export const html=()=>{};export const css=()=>{};').toString('base64')}`;
 let scheduleSource=ts.transpile(fs.readFileSync(new URL('../src/features/preferences/schedules.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext});
 scheduleSource=scheduleSource.replace("from 'lit'",`from '${litStub}'`).replace("from '../../state/store'",`from '${storeUrl}'`);
 globalThis.customElements={define(){}};
 const originalInterval=globalThis.setInterval;globalThis.setInterval=()=>0;
 let schedules;try{schedules=await import(`data:text/javascript;base64,${Buffer.from(scheduleSource).toString('base64')}`);}finally{globalThis.setInterval=originalInterval;}
 const rule={id:'night',label:'Night theme',enabled:true,start:'22:00',end:'08:00',from:'',until:'',weekdays:[1],patch:{theme:'dark'}};
 assert.equal(schedules.scheduleMatches(rule,new Date(2026,9,12,22,0)),true);
 assert.equal(schedules.scheduleMatches(rule,new Date(2026,9,13,7,59)),true);
 assert.equal(schedules.scheduleMatches(rule,new Date(2026,9,13,8,0)),false);
 assert.equal(schedules.scheduleMatches(rule,new Date(2026,9,12,21,59)),false);
 assert.throws(()=>schedules.validateSchedules({version:1,rules:[{...rule,end:'22:00'}]}));
 assert.throws(()=>schedules.validateSchedules({version:1,rules:[rule,rule]}));
 store.updateState({theme:'light'});schedules.saveSchedules([rule]);assert.equal(schedules.effectiveSettings(new Date(2026,9,12,23)).theme,'dark');assert.equal(store.getState().theme,'light');
 schedules.saveSchedules([]);
});
