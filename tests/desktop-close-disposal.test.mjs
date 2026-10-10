import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EventEmitter} from 'node:events';
const source=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function createCloseHandshake'),source.indexOf("autoUpdater.on('error'"));
function setup(){
 const timers=new Map();let next=0;const create=new Function('setTimeout','clearTimeout',helper+';return createCloseHandshake;')(callback=>{const id=++next;timers.set(id,callback);return id},id=>timers.delete(id));
 const window=new EventEmitter();const contents=new EventEmitter();let destroyed=false;const sent=[];
 Object.defineProperty(window,'webContents',{get(){if(destroyed)throw TypeError('Object has been destroyed');return contents}});
 window.isDestroyed=()=>destroyed;contents.isDestroyed=()=>destroyed;contents.send=(channel,message)=>sent.push({channel,message});
 window.close=()=>{const event={prevented:false,preventDefault(){this.prevented=true}};window.emit('close',event);if(!event.prevented){destroyed=true;window.emit('closed');contents.emit('destroyed')}};
 const ipcMain=new EventEmitter();const controller=create({window,ipcMain,isTrusted:event=>event.trusted,nonce:()=>`request-${next}`,timeoutMs:10});
 return {window,contents,ipcMain,controller,timers,sent,destroyed:()=>destroyed,destroyContents(){destroyed=true;contents.emit('destroyed')},destroyExternally(){destroyed=true;window.emit('closed');contents.emit('destroyed')}};
}
function assertDisposed(s){assert.equal(s.timers.size,0);assert.equal(s.window.listenerCount('close'),0);assert.equal(s.window.listenerCount('closed'),0);assert.equal(s.contents.listenerCount('destroyed'),0);assert.equal(s.contents.listenerCount('render-process-gone'),0);assert.equal(s.contents.listenerCount('did-start-navigation'),0);assert.equal(s.ipcMain.listenerCount('native:close-response'),0)}
test('approved close cleans up after the BrowserWindow webContents getter becomes invalid',()=>{
 const s=setup();s.window.close();const response={requestId:s.sent[0].message.requestId,approved:true};assert.doesNotThrow(()=>s.ipcMain.emit('native:close-response',{trusted:true},response));assert.equal(s.destroyed(),true);assertDisposed(s);assert.doesNotThrow(()=>s.controller.dispose());assertDisposed(s);
});
test('external destroyed lifecycle clears pending approval and listener/timer state exactly once',()=>{
 const s=setup();s.window.close();assert.equal(s.timers.size,1);assert.doesNotThrow(()=>s.destroyExternally());assertDisposed(s);assert.doesNotThrow(()=>{s.controller.dispose();s.window.emit('closed');s.contents.emit('did-start-navigation');s.ipcMain.emit('native:close-response',{trusted:true},{requestId:s.sent[0].message.requestId,approved:true})});assertDisposed(s);
});
test('web contents destruction before closed also disposes all pending handshake state',()=>{
 const s=setup();s.window.close();assert.doesNotThrow(()=>s.destroyContents());assertDisposed(s);assert.doesNotThrow(()=>s.window.emit('closed'));assertDisposed(s);
});
test('trusted renderer predicate rejects late IPC without reading destroyed window contents',()=>{
 const match=source.match(/const trusted = (event => [^\n]+);/);assert.ok(match);const s=setup();s.contents.mainFrame={url:'app://jackson/index.html#tools'};
 const trusted=new Function('window','webContents',`return (${match[1]});`)(s.window,s.contents);const event={sender:s.contents,senderFrame:s.contents.mainFrame};assert.equal(trusted(event),true);s.destroyExternally();assert.doesNotThrow(()=>trusted(event));assert.equal(trusted(event),false);
});
