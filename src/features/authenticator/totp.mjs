export function base32(value) {
  const clean = value.toUpperCase().replace(/[\s=-]/g, '');
  if (!clean || !/^[A-Z2-7]+$/.test(clean)) throw new Error('Enter a valid Base32 secret.');
  let bits = 0, buffer = 0; const bytes = [];
  for (const letter of clean) { buffer = (buffer << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(letter); bits += 5; if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); } }
  if (bits && (buffer & ((1 << bits) - 1))) throw new Error('Invalid Base32 padding bits.');
  if (bytes.length < 10 || bytes.length > 128) throw new Error('Unsupported secret size.');
  return new Uint8Array(bytes);
}
export async function totp(secret, { algorithm = 'SHA-1', digits = 6, period = 30, time = Date.now() } = {}) {
  if (!['SHA-1','SHA-256','SHA-512'].includes(algorithm) || !Number.isInteger(digits) || digits < 6 || digits > 8 || !Number.isInteger(period) || period < 1 || period > 86400 || !Number.isFinite(time) || time < 0) throw new Error('Invalid authenticator parameters.');
  const key = await crypto.subtle.importKey('raw', base32(secret), {name:'HMAC', hash:algorithm}, false, ['sign']);
  const counter = new Uint8Array(8); new DataView(counter.buffer).setBigUint64(0, BigInt(Math.floor(time / 1000 / period)));
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter)); const offset = digest[digest.length - 1] & 15;
  const number = new DataView(digest.buffer).getUint32(offset) & 0x7fffffff;
  return String(number % 10 ** digits).padStart(digits, '0');
}
export async function vaultKey(password, salt) {
  if (password.length < 12) throw new Error('Use a vault password of at least 12 characters.');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}
export async function seal(entries, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({name:'AES-GCM',iv}, await vaultKey(password,salt), new TextEncoder().encode(JSON.stringify(entries)));
  return {version:1,salt:Array.from(salt),iv:Array.from(iv),data:Array.from(new Uint8Array(data))};
}
export async function unseal(record, password) {
  if (record?.version !== 1 || !Array.isArray(record.data) || record.data.length > 1000000) throw new Error('Unsupported vault.');
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(record.iv)},await vaultKey(password,new Uint8Array(record.salt)),new Uint8Array(record.data)))); }
  catch { throw new Error('The vault could not be unlocked.'); }
}
