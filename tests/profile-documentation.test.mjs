import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/components/documentation.ts',import.meta.url),'utf8').split('class Documentation')[0].replace(/^import .*;$/gm,'');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};const html=(strings,...values)=>({strings:[...strings],values});
new Function('exports','html','location',compiled)(exports,html,{href:'https://example.com/profile/'});
test('Documentation links reject executable and file protocols',()=>{for(const value of ['javascript:alert(1)','data:text/html,hello','file:///secret','vbscript:msgbox(1)'])assert.equal(exports.safeLink(value),null);assert.equal(exports.safeLink('https://example.com/guide'),'https://example.com/guide');assert.equal(exports.safeLink('mailto:person@example.com'),'mailto:person@example.com');});
test('Raw HTML and code stay text values rather than executable templates',()=>{const payload='<img src=x onerror=alert(1)>';const output=exports.markdown(`${payload}\n\n\`\`\`html\n${payload}\n\`\`\``);const serialized=JSON.stringify(output);assert.ok(serialized.includes(payload));assert.ok(!output.strings.join('').includes(payload));assert.ok(!serialized.includes('unsafeHTML'));});
test('Markdown article links use internal navigation and preserve target as data',()=>{const output=exports.inlineMarkdown('[Guide](../guide.md)');assert.equal(output.values[0][1].values[0],'../guide.md');assert.ok(output.values[0][1].strings.join('').includes('data-article-link'));assert.ok(output.values[0][1].strings.join('').includes('#docs'));});

