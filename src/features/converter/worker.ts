import {pdfTool,convertText,archive} from './core.mjs';
import {convertImage} from './images.mjs';
import {convertCodeText} from './text.mjs';
self.onmessage=async(event)=>{try{const {inputs,operation,options}=event.data;const result=operation.startsWith('pdf:')?await pdfTool(inputs,operation.slice(4),options):operation.startsWith('image:')?await convertImage(inputs[0],operation.slice(6)):operation.startsWith('text:')?convertCodeText(inputs[0],operation):operation==='zip'?archive(inputs[0],options.name):convertText(inputs[0],operation,options.source);self.postMessage({ok:true,result});}catch{self.postMessage({ok:false,error:'Operation rejected: malformed, unsupported, encrypted or limit-exceeding input. Check the chosen format and page selection.'});}};
