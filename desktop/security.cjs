'use strict';
const ORIGIN = 'https://ding-ding-projects.github.io';
const SITE = `${ORIGIN}/jackson-chung/`;
const operations = new Set(['window.minimize','window.maximize','window.close','store.read','store.write','history.unlock','history.lock','history.list','history.restore','file.import','file.export','editor.open','ollama.tags','ollama.ps','ollama.catalog','ollama.catalog.refresh','ollama.hardware','ollama.model','ollama.chat','ollama.pull','task.poll','task.cancel','pairing.create','pairing.revoke','pairing.list']);
function validSite(value) { try { const u = new URL(value); return u.origin === ORIGIN && u.pathname.startsWith('/jackson-chung/') && !u.username && !u.password; } catch { return false; } }
function externalUrl(value) { const u = new URL(value); if (!['https:','mailto:'].includes(u.protocol) || u.username || u.password || value.length > 2048) throw Error('Unsupported external address'); return u.href; }
function validate(operation,input) { if (!operations.has(operation)) throw Error('Unsupported operation'); if (Buffer.byteLength(JSON.stringify(input ?? null)) > 1048576) throw Error('Request exceeds 1 MiB'); if (input !== undefined && (input === null || typeof input !== 'object' || Array.isArray(input))) throw Error('Expected an object'); return input ?? {}; }
module.exports = { ORIGIN,SITE,operations,validSite,externalUrl,validate };
