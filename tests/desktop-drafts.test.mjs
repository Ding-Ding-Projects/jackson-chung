import test from 'node:test';
import assert from 'node:assert/strict';
import {createJsonDraft,createModelDraft} from '../src/features/companion/draft-controller.ts';
import {registerDraftProvider,draftStatus,applyDraftDecision,getDrafts} from '../src/state/drafts.ts';
test('JSON save requires real acknowledgement and retains edits on failure',async()=>{
 for(const save of [async()=>{throw Error('service unavailable')},async()=>({saved:false}),async()=>({})]){const draft=createJsonDraft(save);draft.text='{"changed":true}';await assert.rejects(draft.save());assert.equal(draft.text,'{"changed":true}');assert.equal(draft.isDirty(),true);assert.equal(draft.canDispose(),true);}
 const invalid=createJsonDraft(async()=>{throw Error('Must not run')});invalid.text='{';await assert.rejects(invalid.save());assert.equal(invalid.text,'{');
});
test('JSON baseline advances only to acknowledged snapshot, preserving concurrent edits',async()=>{
 let acknowledge;const draft=createJsonDraft(()=>new Promise(resolve=>{acknowledge=resolve}));
 draft.load({initial:1});assert.equal(draft.isDirty(),false);draft.text='{"saved":2}';const saving=draft.save();assert.equal(draft.canDispose(),false);assert.throws(()=>draft.discard());draft.text='{"newer":3}';acknowledge({saved:true});await saving;assert.equal(draft.isDirty(),true);draft.discard();assert.equal(draft.text,'{"saved":2}');assert.equal(draft.isDirty(),false);
 draft.text='changed';assert.throws(()=>draft.load({overwrite:true}));assert.equal(draft.text,'changed');
});
test('model discard removes only transient inputs and never invokes native work',()=>{
 const draft=createModelDraft();draft.model='fixture:latest';draft.message='unsent';draft.pulls='another:model';assert.equal(draft.isDirty(),true);draft.discard();assert.equal(draft.model,'');assert.equal(draft.message,'');assert.equal(draft.pulls,'');assert.equal(draft.isDirty(),false);
});
test('shared provider decisions veto busy disposal, require acknowledgement and unregister',async()=>{
 const owner={dataset:{tabId:'companion-test-tab'}};let busy=true;let acknowledge=false;
 const draft=createJsonDraft(async()=>({saved:acknowledge}));draft.text='{"edited":1}';
 const unregister=registerDraftProvider(owner,{id:'companion.records',label:{en:'Records',yue:'記錄'},isDirty:draft.isDirty,save:draft.save,discard:draft.discard,canDispose:()=>!busy&&draft.canDispose()});
 try{assert.equal(draftStatus(['companion-test-tab']).blocked,true);assert.equal((await applyDraftDecision(['companion-test-tab'],'save')).reason,'busy');busy=false;assert.equal((await applyDraftDecision(['companion-test-tab'],'save')).reason,'operation');assert.equal(draft.isDirty(),true);acknowledge=true;assert.equal((await applyDraftDecision(['companion-test-tab'],'save')).ok,true);assert.equal(draft.isDirty(),false);}finally{unregister()}
 assert.equal(getDrafts(['companion-test-tab']).length,0);
});
test('unsent model inputs cannot claim a save that has no persistence adapter',async()=>{
 const model=createModelDraft();model.message='retain until resolved';const unregister=registerDraftProvider({dataset:{tabId:'model-test-tab'}},{id:'companion.model-message',label:{en:'Unsent message',yue:'未傳訊息'},isDirty:model.isDirty,discard:model.discard,canDispose:()=>true});
 try{assert.equal((await applyDraftDecision(['model-test-tab'],'save')).reason,'save-unavailable');assert.equal(model.message,'retain until resolved');assert.equal((await applyDraftDecision(['model-test-tab'],'discard',{keyOne:true,keyTwo:true,value:100})).ok,true);assert.equal(model.message,'');}finally{unregister()}
});
