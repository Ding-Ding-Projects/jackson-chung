const LIMIT=2*1024*1024;
export const TEXT_OPERATIONS=Object.freeze(['text:json-pretty','text:json-compact','text:lf','text:crlf','text:utf8-bom','text:utf16le','text:utf8-from-utf16','text:html-escape']);
function jsonShape(text){let depth=0,quoted=false,escaped=false,items=0;for(const letter of text){if(quoted){if(escaped)escaped=false;else if(letter==='\\')escaped=true;else if(letter==='"')quoted=false;}else if(letter==='"')quoted=true;else if(letter==='{'||letter==='['){if(++depth>64)throw Error('JSON nesting exceeds 64 levels.');}else if(letter==='}'||letter===']')depth--;else if(letter===','&&++items>100000)throw Error('JSON item count exceeds 100,000.');}if(depth!==0||quoted)throw Error('Incomplete JSON.');}
export function convertCodeText(bytes,operation){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>LIMIT||!TEXT_OPERATIONS.includes(operation))throw Error('Text input must be 1 byte to 2 MiB and use a supported operation.');
 let text;
 if(operation==='text:utf8-from-utf16'){if(bytes.length<4||bytes.length%2||bytes[0]!==255||bytes[1]!==254)throw Error('UTF-16LE input requires its byte-order mark.');text=new TextDecoder('utf-16le',{fatal:true}).decode(bytes);}
 else text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(text.includes('\0'))throw Error('Binary content is not a text source.');let result=text;
 if(operation.startsWith('text:json-')){jsonShape(text);const parsed=JSON.parse(text);result=JSON.stringify(parsed,null,operation==='text:json-pretty'?2:0);if(JSON.stringify(JSON.parse(result))!==JSON.stringify(parsed))throw Error('JSON output validation failed.');}
 if(operation==='text:lf')result=text.replace(/\r\n|\r/g,'\n');
 if(operation==='text:crlf')result=text.replace(/\r\n|\r|\n/g,'\n').replace(/\n/g,'\r\n');
 if(operation==='text:html-escape')result=text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 let output;
 if(operation==='text:utf16le'){output=new Uint8Array(2+result.length*2);output.set([255,254]);const view=new DataView(output.buffer);for(let i=0;i<result.length;i++)view.setUint16(2+i*2,result.charCodeAt(i),true);if(new TextDecoder('utf-16le',{fatal:true}).decode(output)!==result)throw Error('UTF-16 output validation failed.');}
 else {const encoded=new TextEncoder().encode(result);if(operation==='text:utf8-bom'){output=new Uint8Array(encoded.length+3);output.set([239,187,191]);output.set(encoded,3);}else output=encoded;if(new TextDecoder('utf-8',{fatal:true}).decode(output)!==result)throw Error('UTF-8 output validation failed.');}
 if(output.length>LIMIT)throw Error('Text output exceeds 2 MiB.');return output;
}
