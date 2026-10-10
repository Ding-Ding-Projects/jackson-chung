'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
async function retainedFeed(receipt,payload){
 let bytes=Buffer.from(payload.bytes),index=Buffer.from(payload.index);if(bytes.length!==receipt.package.size||index.length>1048576||crypto.createHash('sha256').update(bytes).digest('hex')!==receipt.package.sha256)throw Error('Retained update bytes mismatch');const row=index.toString('utf8').trim().split(/\s+/);if(row.length!==3||row[0].toLowerCase()!==receipt.package.sha1||row[1]!==receipt.package.name||Number(row[2])!==bytes.length||crypto.createHash('sha1').update(bytes).digest('hex')!==receipt.package.sha1)throw Error('Retained index mismatch');
 const prefix='/updates';let active=0,closed=false;const sockets=new Set();
 const server=http.createServer((request,response)=>{const pathname=(request.url??'').split('?')[0];if(closed||request.socket.remoteAddress!=='127.0.0.1'||request.headers.host!==`127.0.0.1:${server.address().port}`||request.url.length>2048||!['GET','HEAD'].includes(request.method)||request.headers['content-length']||request.headers['transfer-encoding']||active>=4){response.writeHead(400);response.end();return}const data=pathname===prefix+'/RELEASES'?index:pathname===prefix+'/'+receipt.package.name?bytes:null;if(!data){response.writeHead(404);response.end();return}active++;response.once('close',()=>active--);response.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-store','Connection':'close'});response.end(request.method==='HEAD'?undefined:data)});
 server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=32;server.on('connection',socket=>{sockets.add(socket);socket.setTimeout(30000,()=>socket.destroy());socket.once('close',()=>sockets.delete(socket))});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});server.on('error',()=>{});const timer=setTimeout(close,15*60*1000);timer.unref?.();
 function close(){if(closed)return;closed=true;clearTimeout(timer);server.close();for(const socket of sockets)socket.destroy();bytes=null;index=null}
 return {url:`http://127.0.0.1:${server.address().port}${prefix}/`,close};
}
module.exports={retainedFeed};
