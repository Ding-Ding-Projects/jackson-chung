export function openSupport(){window.dispatchEvent(new CustomEvent('jc-navigate',{detail:'support'}));}
export function browserRecovery(){return{kind:'browser-local' as const,storageKey:'jc.support-tickets.v1',credentialDatabase:'jc.local-lock-credentials',nativeFolderAvailable:false,origin:location.origin};}
