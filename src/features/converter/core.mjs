import { PDFDocument, PDFDict, PDFName, degrees } from 'pdf-lib';
import { zipSync, unzipSync } from 'fflate';
export const MAX_BYTES = 20 * 1024 * 1024;
export function bounded(bytes) { if (!(bytes instanceof Uint8Array) || bytes.length > MAX_BYTES || !bytes.length) throw new Error('Choose a nonempty file up to 20 MiB.'); return bytes; }
export function detect(bytes) {
  bounded(bytes); const head = new TextDecoder().decode(bytes.slice(0,32));
  if (head.startsWith('%PDF-')) return 'pdf';
  if (bytes[0]===80 && bytes[1]===75 && bytes[2]===3 && bytes[3]===4) return 'zip';
  if (bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71) return 'png';
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'jpeg';
  try { const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes); if (text.includes('\0')) return 'binary'; try {JSON.parse(text); return 'json';} catch {return 'text';} } catch {return 'binary';}
}
export function parseTable(text, delimiter=',') {
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else if(quoted || field==='') quoted=!quoted;else throw new Error('Unexpected quote.');}else if(c===delimiter&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}else field+=c;}
  if(quoted)throw new Error('Unclosed quoted field.');if(field!==''||row.length){row.push(field);rows.push(row);}return rows;
}
export function writeTable(rows, delimiter=','){if(!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)))throw new Error('Expected an array of rows.');return rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(delimiter)).join('\r\n');}
export async function pdfTool(inputs, operation, {pages=[],rotation=90,title=''}={}) {
  if(!inputs.length||inputs.length>20)throw new Error('Select 1 to 20 PDFs.');
  const docs=await Promise.all(inputs.map(async bytes=>{if(detect(bytes)!=='pdf')throw new Error('Source is not a PDF.');const doc=await PDFDocument.load(bytes);if(doc.context.enumerateIndirectObjects().some(([,obj])=>obj instanceof PDFDict && (obj.has(PDFName.of('ByteRange')) || obj.get(PDFName.of('Type'))===PDFName.of('Sig'))))throw new Error('Signed PDFs are unsupported.');if(doc.getPageCount()>500)throw new Error('Maximum 500 pages per PDF.');if(doc.getForm().getFields().length)throw new Error('Interactive forms are unsupported.');return doc;}));
  const first=docs[0], count=first.getPageCount(); if(operation==='inspect')return {pages:count,title:first.getTitle()??'',rotations:first.getPages().map(p=>p.getRotation().angle)};
  if(!['merge','extract','reorder','rotate','metadata','split'].includes(operation))throw new Error('Unknown PDF operation.');
  const selected=pages.length?pages:Array.from({length:count},(_,i)=>i);
  if(selected.some(p=>!Number.isInteger(p)||p<0||p>=count))throw new Error('Page numbers must exist in the source.');
  if(operation==='reorder'&&(selected.length!==count||new Set(selected).size!==count))throw new Error('Reorder must contain every page exactly once.');
  if(operation==='split'){const results=[];let total=0;for(const p of selected){const result=await pdfTool(inputs.slice(0,1),'extract',{pages:[p]});total+=result.length;if(total>MAX_BYTES)throw new Error('Combined split output exceeds 20 MiB.');results.push(result);}return results;}
  let output;
  if(operation==='rotate'||operation==='metadata'){output=first;if(operation==='rotate'){if(![90,180,270].includes(rotation))throw new Error('Choose 90, 180 or 270 degrees.');for(const p of selected)output.getPage(p).setRotation(degrees((output.getPage(p).getRotation().angle+rotation)%360));}else output.setTitle(title);}
  else {output=await PDFDocument.create();for(const source of operation==='merge'?docs:[first]){const indices=operation==='merge'?source.getPageIndices():selected;for(const page of await output.copyPages(source,indices))output.addPage(page);}}
  if(output.getPageCount()>500)throw new Error('Output exceeds 500 pages.');
  const expected=output.getPages().map(p=>({rotation:p.getRotation().angle,width:p.getWidth(),height:p.getHeight()}));const bytes=await output.save();bounded(bytes);const checked=await PDFDocument.load(bytes);
  if(JSON.stringify(checked.getPages().map(p=>({rotation:p.getRotation().angle,width:p.getWidth(),height:p.getHeight()})))!==JSON.stringify(expected)||operation==='metadata'&&checked.getTitle()!==title)throw new Error('PDF validation failed.');
  return bytes;
}
export function convertText(bytes, target, source='text') {
  bounded(bytes); const decoder=new TextDecoder('utf-8',{fatal:true});let result;
  if(target==='hex')result=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  else if(target==='base64'){let s='';for(const b of bytes)s+=String.fromCharCode(b);result=btoa(s);}
  else if(target==='decode-base64'){const s=atob(decoder.decode(bytes).trim());return Uint8Array.from(s,c=>c.charCodeAt(0));}
  else if(target==='decode-hex'){const s=decoder.decode(bytes).trim();if(!/^(?:[\da-f]{2})+$/i.test(s))throw new Error('Enter complete hexadecimal byte pairs.');return Uint8Array.from(s.match(/../g),v=>parseInt(v,16));}
  else if(target==='json')result=JSON.stringify(source==='json'?JSON.parse(decoder.decode(bytes)):parseTable(decoder.decode(bytes),source==='tsv'?'\t':','),null,2);
  else if(target==='csv'||target==='tsv'){const rows=source==='json'?JSON.parse(decoder.decode(bytes)):parseTable(decoder.decode(bytes),source==='tsv'?'\t':',');result=writeTable(rows,target==='csv'?',':'\t');parseTable(result,target==='csv'?',':'\t');}
  else throw new Error('Unsupported conversion.');return bounded(new TextEncoder().encode(result));
}
export function archive(bytes,name){bounded(bytes);const output=zipSync({[name.replace(/[\\/]/g,'_')||'file']:bytes});bounded(output);const checked=unzipSync(output);if(Object.values(checked)[0].length!==bytes.length)throw new Error('Archive validation failed.');return output;}
