import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanionClose} from '../src/features/companion/close-controller.ts';
import {registerDraftProvider,draftStatus} from '../src/state/drafts.ts';
import {connectNativeDraftClose} from '../src/components/shell-integration.ts';
test('clean close survives a trusted close event before invoke response',async()=>{
 const order=[];let pendingRequests=0;let handshake;
 const unregister=registerDraftProvider({dataset:{tabId:'ordered-close'}},{id:'records',label:{en:'Records',yue:'記錄'},isDirty:()=>false,discard:()=>{},canDispose:()=>pendingRequests===0});
 const resolve=async()=>{order.push('resolve drafts');const status=draftStatus(['ordered-close']);return !status.blocked&&!status.dirty.length};
 const disconnect=connectNativeDraftClose({onCloseRequested:callback=>{handshake=callback;return()=>{handshake=null}}},resolve);
 try{
  const close=createCompanionClose({resolveDrafts:resolve,canDispose:()=>!draftStatus(['ordered-close']).blocked,requestClose:async()=>{order.push('native close event');const approved=await handshake();order.push('invoke response');return {ok:approved}}});
  assert.equal(await close(),'requested');assert.deepEqual(order,['resolve drafts','native close event','resolve drafts','invoke response']);assert.equal(pendingRequests,0);
 }finally{disconnect();unregister()}
});
test('dirty cancellation and unrelated busy work never initiate native close',async()=>{
 let calls=0;let dirty=true;let otherBusy=false;
 const unregister=registerDraftProvider({dataset:{tabId:'blocked-close'}},{id:'message',label:{en:'Message',yue:'訊息'},isDirty:()=>dirty,discard:()=>{},canDispose:()=>!otherBusy});
 try{const close=createCompanionClose({resolveDrafts:async()=>{const state=draftStatus(['blocked-close']);return !state.blocked&&!state.dirty.length},canDispose:()=>!draftStatus(['blocked-close']).blocked,requestClose:async()=>{calls++;return {ok:true}}});assert.equal(await close(),'cancelled');dirty=false;otherBusy=true;assert.equal(await close(),'cancelled');assert.equal(calls,0);}finally{unregister()}
});
test('new unrelated busy state after draft resolution still vetoes close',async()=>{
 let busy=false;let calls=0;const close=createCompanionClose({resolveDrafts:async()=>{busy=true;return true},canDispose:()=>!busy,requestClose:async()=>{calls++;return {ok:true}}});assert.equal(await close(),'busy');assert.equal(calls,0);
});
test('close transport errors recover and duplicate requests do not race',async()=>{
 let attempt=0;let finish;const close=createCompanionClose({resolveDrafts:async()=>true,canDispose:()=>true,requestClose:async()=>{attempt++;if(attempt===1)throw Error('transport unavailable');if(attempt===2)return {ok:false};return new Promise(resolve=>{finish=resolve})}});
 assert.equal(await close(),'error');assert.equal(await close(),'error');const pending=close();await new Promise(resolve=>setImmediate(resolve));assert.equal(await close(),'busy');finish({ok:true});assert.equal(await pending,'requested');
});
test('draft resolver errors remain recoverable without invoking native close',async()=>{
 let fail=true;let calls=0;const close=createCompanionClose({resolveDrafts:async()=>{if(fail)throw Error('resolver unavailable');return true},canDispose:()=>true,requestClose:async()=>{calls++;return {ok:true}}});assert.equal(await close(),'error');assert.equal(calls,0);fail=false;assert.equal(await close(),'requested');assert.equal(calls,1);
});
