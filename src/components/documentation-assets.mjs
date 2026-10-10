/** Only these reviewed documentation resources may be bundled and linked. */
export const documentationResourceInventory=Object.freeze([Object.freeze({source:'docs/features/tools/media-assets.json',destination:'documentation-assets/media-assets.json',download:'media-assets.json',type:'application/json'})]);
export function resolveDocumentationResource(target,articlePath,assetBase='./'){
 if(typeof target!=='string'||typeof articlePath!=='string'||!target||/[^a-z0-9._/-]/i.test(target)||target.startsWith('/')||target.includes('//')||target.split('/').some(part=>!part||part==='.'||part==='..'))return null;
 if(!/^docs\/[a-z0-9._/-]+\.md$/i.test(articlePath)||articlePath.split('/').some(part=>part==='.'||part==='..'))return null;
 const source=articlePath.slice(0,articlePath.lastIndexOf('/')+1)+target;
 const resource=documentationResourceInventory.find(item=>item.source===source);
 return resource?{href:assetBase+resource.destination,download:resource.download,type:resource.type}:null;
}
