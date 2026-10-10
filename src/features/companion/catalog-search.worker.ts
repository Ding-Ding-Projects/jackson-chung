self.onmessage=(event:MessageEvent<{names:string[];pattern:string}>)=>{
 try{if(event.data.pattern.length>512||event.data.names.length>100000)throw Error('Search bound exceeded');const pattern=new RegExp(event.data.pattern,'iu');self.postMessage({matches:event.data.names.filter(name=>pattern.test(name)),error:null});}catch{self.postMessage({matches:[],error:'Invalid expression or search bound exceeded'});}
};
