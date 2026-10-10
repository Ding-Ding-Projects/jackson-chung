import test from 'node:test';
import assert from 'node:assert/strict';
import {focusPaletteSearch} from '../src/features/search/palette-focus.mjs';
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
function fixture(){
 const parent=deferred(),child=deferred(),control=deferred();let focused=0;
 const field={updateComplete:control.promise,focus(){focused++;}};
 const search={updateComplete:child.promise,renderRoot:{querySelector:()=>field}};
 const palette={updateComplete:parent.promise,renderRoot:{querySelector:()=>search}};
 return {parent,child,control,palette,get focused(){return focused;}};
}
test('initial palette focus waits for parent, search and field render completion',async()=>{
 const f=fixture();const pending=focusPaletteSearch(f.palette,()=>true);
 f.parent.resolve();await Promise.resolve();assert.equal(f.focused,0);
 f.child.resolve();await Promise.resolve();assert.equal(f.focused,0);
 f.control.resolve();assert.equal(await pending,true);assert.equal(f.focused,1);
});
test('closing or reopening cancels an older asynchronous focus request',async()=>{
 for(const boundary of ['parent','child','control']){
  const f=fixture();let current=true;const pending=focusPaletteSearch(f.palette,()=>current);
  if(boundary!=='parent'){f.parent.resolve();await Promise.resolve();}
  if(boundary==='control'){f.child.resolve();await Promise.resolve();}
  current=false;f.parent.resolve();f.child.resolve();f.control.resolve();
  assert.equal(await pending,false);assert.equal(f.focused,0);
 }
});
test('missing search controls do not move focus outside the palette',async()=>{
 const palette={updateComplete:Promise.resolve(),renderRoot:{querySelector:()=>null}};
 assert.equal(await focusPaletteSearch(palette,()=>true),false);
});
