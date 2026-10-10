import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { assertBuildSource } from './build-source.mjs';
assertBuildSource();
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const source = execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const sourceDate = execFileSync('git', ['show', '-s', '--format=%cI', 'HEAD'], {encoding:'utf8'}).trim();
const buildStarted = new Date().toISOString();
execFileSync(process.execPath, ['scripts/check-vocabulary.mjs'], {stdio:'inherit'});
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--base', './'], {stdio:'inherit'});
const provenance = { version: process.env.BUILD_VERSION || pkg.version, source, sourceDate, builtAt: buildStarted, timezone:'UTC', target:'web-and-windows' };
writeFileSync('dist/build-info.json', JSON.stringify(provenance, null, 2)+'\n');
writeFileSync('dist/.nojekyll', '');
const articles=[];
function collect(root, kind){
  if(!existsSync(root)) return;
  function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const file=join(dir,item.name);if(item.isDirectory())walk(file);else if(item.name.endsWith('.md')){const content=readFileSync(file,'utf8');const path=file.replaceAll('\\','/');const id=path.replace(/\.md$/,'').replaceAll('/','-');articles.push({id,title:/^#\s+(.+)$/m.exec(content)?.[1] || item.name,category:relative(root,dir).replaceAll('\\','/') || 'overview',kind,content,path,related:[]});}}}
  walk(root);
}
collect('docs','docs'); collect('wiki','wiki');
writeFileSync('dist/documentation.json',JSON.stringify({version:1,source,articles},null,2)+'\n');
mkdirSync('.agent/builds', {recursive:true});
const indexHash = createHash('sha256').update(readFileSync('dist/index.html')).digest('hex');
writeFileSync('.agent/builds/latest.json', JSON.stringify({...provenance, indexHash, completedAt:new Date().toISOString()},null,2)+'\n');
console.log(`Built ${provenance.version} from ${source}; index SHA-256 ${indexHash}`);
