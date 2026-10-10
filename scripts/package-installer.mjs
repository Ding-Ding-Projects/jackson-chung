import packager from '@electron/packager';
import installer from 'electron-winstaller';
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const version=process.env.BUILD_VERSION || pkg.version;
const stage=resolve('.agent/package-stage');
mkdirSync(stage,{recursive:true});
for (const name of ['dist','desktop']) {
  if (!existsSync(name)) throw new Error(`Required payload is missing: ${name}`);
  cpSync(name,resolve(stage,name),{recursive:true});
}
writeFileSync(resolve(stage,'package.json'),JSON.stringify({name:'jackson-chung-companion',version,description:pkg.description,author:'Jackson Chung',main:'desktop/main.cjs'},null,2));
const icon=existsSync('public/icon.ico') ? resolve('public/icon.ico') : undefined;
if (!icon) throw new Error('A verified multi-resolution public/icon.ico is required before installer production.');
const paths=await packager({dir:stage,out:resolve('out'),name:'JacksonChung',platform:'win32',arch:'x64',electronVersion:pkg.devDependencies.electron,appVersion:version,overwrite:true,icon,prune:false,asar:true,win32metadata:{CompanyName:'Ding Ding Projects',FileDescription:'Jackson Chung local companion',ProductName:'Jackson Chung'}});
mkdirSync('release',{recursive:true});
await installer.createWindowsInstaller({appDirectory:paths[0],outputDirectory:resolve('release'),authors:'Jackson Chung',exe:'JacksonChung.exe',name:'JacksonChung',version,description:pkg.description,setupExe:'Setup.exe',setupIcon:icon,noMsi:true,signWithParams:undefined});
console.log(`Unsigned Squirrel.Windows installer produced for ${version}. Runtime and installation verification are separate.`);
