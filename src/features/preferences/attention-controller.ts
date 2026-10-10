export type AttentionFlags={focus:boolean;lowStimulation:boolean;timeAwareness:boolean;oneThing:boolean;momentum:boolean};
export const attentionTiming={idleMs:5*60_000,snoozeMs:15*60_000};
/** Clock state is transient and records elapsed wall time, not a productivity score. */
export class AttentionClock{
 private started:number;private changed:number;private activityAt:number;private snoozeUntil=0;private prompted=false;private visible=true;private busy=false;
 constructor(private now:()=>number=Date.now){this.started=this.changed=this.activityAt=this.now();}
 activity(meaningful=false){const at=this.now();this.activityAt=at;this.prompted=false;if(meaningful)this.changed=at;}
 setVisible(value:boolean){this.visible=value;if(value)this.activity();}
 setBusy(value:boolean){if(this.busy&&!value)this.activity();this.busy=value;}
 snooze(){this.snoozeUntil=this.now()+attentionTiming.snoozeMs;this.prompted=false;}
 dismiss(){this.prompted=true;}
 snapshot(enabled:boolean){const at=this.now(),idle=Math.max(0,at-this.activityAt);const prompt=enabled&&this.visible&&!this.busy&&!this.prompted&&at>=this.snoozeUntil&&idle>=attentionTiming.idleMs;if(prompt)this.prompted=true;return{sessionMs:Math.max(0,at-this.started),unchangedMs:Math.max(0,at-this.changed),background:!this.visible,busy:this.busy,prompt,snoozeRemainingMs:Math.max(0,this.snoozeUntil-at)};}
}
const nextKey='jc.attention.next-action.v1';
export function validateNextAction(value:unknown){if(typeof value!=='string'||value.length>500||/[\u0000-\u001f\u007f\u0085\u2028\u2029]/.test(value))throw Error('Next action must be a single line of at most 500 characters.');return value.trim();}
export function readNextAction(storage?:Pick<Storage,'getItem'>){try{return validateNextAction((storage??localStorage).getItem(nextKey)||'');}catch{return '';}}
export function saveNextAction(value:unknown,storage:Pick<Storage,'setItem'|'removeItem'>=localStorage){const text=validateNextAction(value);if(text)storage.setItem(nextKey,text);else storage.removeItem(nextKey);return text;}
export function attentionDuration(ms:number){return Math.floor(Math.max(0,ms)/60_000);}
export function idlePromptCopy(level:number,language:'en'|'yue'){
 const index=Number.isInteger(level)&&level>=1&&level<=5?level-1:0;
 const en=['Your work remains available.','Your work remains available when you return.','Your work remains available, with its place kept.','Your work remains available; the page can wait.','Your work remains available. The page has kept your seat.'];
 const yue=['原有工作仍然保留。','返回時仍然可以繼續。','原有工作留返喺原位。','原有工作仍然保留，頁面可以等。','原有工作仍然保留，頁面幫你留咗個位。'];
 return language==='en'?en[index]:yue[index];
}
