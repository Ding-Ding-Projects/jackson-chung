import {bounded,detect} from './core.mjs';
export function imageDimensions(bytes) {
  const type=detect(bytes), view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let width=0,height=0;
  if(type==='png'){
    if(bytes.length<33||view.getUint32(8)!==13||view.getUint32(12)!==0x49484452)throw new Error('Invalid PNG header.');
    width=view.getUint32(16);height=view.getUint32(20);
    for(let i=8;i+12<=bytes.length;){const length=view.getUint32(i);if(length>bytes.length-i-12)throw new Error('Invalid PNG chunk.');if(view.getUint32(i+4)===0x6163544c)throw new Error('Animated PNG is unsupported.');i+=length+12;}
  }else if(type==='jpeg'){
    let i=2;while(i+4<=bytes.length){if(bytes[i++]!==255)throw new Error('Invalid JPEG marker.');while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===217||marker===218)break;if(marker===216||marker===1||(marker>=208&&marker<=215))continue;const length=view.getUint16(i);if(length<2||length>bytes.length-i)throw new Error('Invalid JPEG segment.');if([192,193,194].includes(marker)){if(length<8)throw new Error('Invalid JPEG frame.');height=view.getUint16(i+3);width=view.getUint16(i+5);break;}i+=length;}
  }else throw new Error('Only PNG and JPEG sources are enabled.');
  if(!width||!height||width>8192||height>8192||width*height>16000000)throw new Error('Images are limited to 8192 pixels per side and 16 megapixels.');
  return {width,height,type};
}
export async function convertImage(bytes,target){
  bounded(bytes);const expected=imageDimensions(bytes);
  if(!['png','jpeg','webp'].includes(target)||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined')throw new Error('This browser lacks isolated canvas image conversion.');
  const bitmap=await createImageBitmap(new Blob([bytes]));
  try{if(bitmap.width!==expected.width||bitmap.height!==expected.height)throw new Error('Image dimensions differ after decode.');const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable.');if(target==='jpeg'){context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);}context.drawImage(bitmap,0,0);const blob=await canvas.convertToBlob({type:'image/'+target,quality:0.9});if(blob.type!=='image/'+target)throw new Error('Target encoder unavailable.');const output=bounded(new Uint8Array(await blob.arrayBuffer()));const checked=await createImageBitmap(blob);try{if(checked.width!==expected.width||checked.height!==expected.height)throw new Error('Output validation failed.');}finally{checked.close();}return output;}finally{bitmap.close();}
}
