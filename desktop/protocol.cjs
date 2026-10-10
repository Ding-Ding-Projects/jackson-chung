'use strict';
const path=require('node:path');
function resolveAsset(raw,root){
  if(typeof raw!=='string'||raw.length>8192)throw Error('Invalid asset URL');
  const u=new URL(raw);
  if(u.protocol!=='app:'||u.hostname!=='jackson'||u.port||u.username||u.password)throw Error('Invalid app origin');
  // Inspect the raw spelling before URL normalization removes dot segments.
  const rawPath=raw.replace(/^app:\/\/jackson/i,'').split(/[?#]/)[0];
  if(rawPath.includes('\\'))throw Error('Invalid path');
  const decoded=decodeURIComponent(rawPath);
  if(decoded.includes('%')||decoded.includes('\\')||decoded.includes('\0')||decoded.split('/').some(p=>p==='.'||p==='..')||decoded.includes(':'))throw Error('Invalid path');
  const target=path.resolve(root,'.'+(decoded||'/index.html'));
  const relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Asset outside bundle');
  return target;
}
module.exports={resolveAsset};
