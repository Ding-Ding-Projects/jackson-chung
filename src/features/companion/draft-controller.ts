/** Transient inputs only. No browser storage, logs or exported draft contents. */
export function createJsonDraft(saveNative:(value:unknown)=>Promise<{saved?:boolean}>) {
  let text='{}';let baseline=text;let saving=false;
  return {
    get text(){return text},set text(value:string){text=value},
    isDirty:()=>text!==baseline,
    canDispose:()=>!saving,
    load(value:unknown){if(text!==baseline||saving)throw Error('Resolve the current draft before loading records.');const serialized=JSON.stringify(value,null,2);if(serialized===undefined)throw Error('Native records were not provided.');text=serialized;baseline=text},
    async save(){if(saving)throw Error('Save already running.');const snapshot=text;const value=JSON.parse(snapshot);saving=true;try{const acknowledgement=await saveNative(value);if(acknowledgement?.saved!==true)throw Error('Native save was not acknowledged.');baseline=snapshot;}finally{saving=false}},
    discard(){if(saving)throw Error('Save is still running.');text=baseline}
  };
}
export function createModelDraft(){
  let model='';let message='';let pulls='';
  return {get model(){return model},set model(value:string){model=value},get message(){return message},set message(value:string){message=value},get pulls(){return pulls},set pulls(value:string){pulls=value},isDirty:()=>model!==''||message!==''||pulls!=='',discard(){model='';message='';pulls=''}};
}
