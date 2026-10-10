import {seal,unseal} from './totp.mjs';
export const VAULT_STORAGE_KEY='jc-authenticator-v1';
export class LocalVault {
  constructor({storage=globalThis.localStorage,locks=globalThis.navigator?.locks,encrypt=seal,decrypt=unseal}={}) {
    this.storage=storage;this.locks=locks;this.encrypt=encrypt;this.decrypt=decrypt;
    this.generation=0;this.password='';this.entries=[];this.unlocked=false;this.pending=Promise.resolve();
  }
  /** @template T @param {()=>Promise<T>|T} operation @returns {Promise<T>} */
  enqueue(operation){const result=this.pending.then(operation);this.pending=result.then(()=>{},()=>{});return result;}
  /** @template T @param {()=>Promise<T>|T} operation @returns {Promise<T>} */
  exclusive(operation){if(!this.locks?.request)throw new Error('Web Locks are required for safe vault writes in this browser.');return this.locks.request('jc-authenticator-vault',()=>operation());}
  current(generation,requireUnlocked=true){if(generation!==this.generation||requireUnlocked&&!this.unlocked)throw new Error('Vault was locked before this operation completed.');}
  lock(){this.generation++;this.password='';this.entries=[];this.unlocked=false;}
  open(password){const generation=this.generation;return this.enqueue(()=>this.exclusive(async()=>{
    this.current(generation,false);const original=this.storage.getItem(VAULT_STORAGE_KEY);
    const entries=original?await this.decrypt(JSON.parse(original),password):[];
    if(!Array.isArray(entries))throw new Error('Invalid vault records.');
    this.current(generation,false);
    if(!original){const encrypted=JSON.stringify(await this.encrypt([],password));this.current(generation,false);if(this.storage.getItem(VAULT_STORAGE_KEY)!==original)throw new Error('Vault changed during creation.');this.storage.setItem(VAULT_STORAGE_KEY,encrypted);}
    this.current(generation,false);this.password=password;this.entries=entries;this.unlocked=true;
    return {entries:structuredClone(entries),existing:Boolean(original)};
  }));}
  mutate(transform){const generation=this.generation;return this.enqueue(()=>this.exclusive(async()=>{
    this.current(generation);const original=this.storage.getItem(VAULT_STORAGE_KEY);
    if(!original)throw new Error('Vault was removed. Unlock again before editing.');
    const password=this.password,current=await this.decrypt(JSON.parse(original),password);
    this.current(generation);if(!Array.isArray(current))throw new Error('Invalid vault records.');
    const next=await transform(structuredClone(current));this.current(generation);
    if(!Array.isArray(next))throw new Error('Invalid vault mutation.');
    const encrypted=JSON.stringify(await this.encrypt(next,password));
    this.current(generation);
    if(this.storage.getItem(VAULT_STORAGE_KEY)!==original)throw new Error('Vault changed outside its write lock. Existing data was kept.');
    this.storage.setItem(VAULT_STORAGE_KEY,encrypted);this.entries=next;
    return structuredClone(next);
  }));}
}
