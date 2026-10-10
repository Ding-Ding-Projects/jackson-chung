import jsQR from 'jsqr';
self.onmessage=e=>{const {data,width,height}=e.data;if(width>640||height>480||data.length!==width*height*4){self.postMessage({value:null});return;}const result=jsQR(new Uint8ClampedArray(data),width,height);self.postMessage({value:result?.data??null});};
