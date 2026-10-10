/** Retains the browser-owned selection without copying an entire queue into an array. */
export class QueueIntake {
 constructor(queue){this.queue=queue;this.selection=undefined;this.index=0;this.busy=false;this.operation='';this.options={};}
 get dirty(){return Boolean(this.selection&&this.index<this.selection.length);}
 get canDispose(){return !this.busy;}
 select(selection,operation,options){if(this.busy||this.dirty)throw Error('Finish or discard the current selection first.');this.selection=selection;this.index=0;this.operation=operation;this.options=structuredClone(options);}
 /** @param {(count:number)=>void} [onProgress] */
 async save(onProgress=()=>{}){if(this.busy)throw Error('Intake is busy.');this.busy=true;try{while(this.selection&&this.index<this.selection.length){const source=this.selection[this.index];await this.queue().add(source,this.operation,this.options);this.index++;onProgress(this.index);}this.selection=undefined;this.index=0;}finally{this.busy=false;}}
 discard(){if(this.busy)throw Error('Intake is busy.');this.selection=undefined;this.index=0;this.options={};}
}
