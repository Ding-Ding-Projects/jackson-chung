import {packager} from '@electron/packager';
import installer from 'electron-winstaller';
import {cpSync,mkdirSync,readFileSync,writeFileSync,existsSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {prepareAssets} from './package-assets.mjs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
if(process.platform!=='win32')throw Error('Windows installer production requires Windows.');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const version=process.env.BUILD_VERSION||pkg.version;
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Installer version must be a normal numeric release version.');
const privateRoot=resolve('.agent');mkdirSync(privateRoot,{recursive:true});
const owned=mkdtempSync(join(privateRoot,'package-run-'));
const stage=join(owned,'stage');mkdirSync(stage);
for(const name of ['dist','desktop']){if(!existsSync(name))throw Error(`Required payload is missing: ${name}`);cpSync(name,join(stage,name),{recursive:true,filter:source=>!/[\\/](bin|obj)([\\/]|$)/.test(source)});}
const assets=await prepareAssets(owned);
cpSync(assets.config,join(stage,'desktop','native-host-config.json'));
writeFileSync(join(stage,'package.json'),JSON.stringify({name:'jackson-chung-companion',version,description:pkg.description,author:'Jackson Chung',main:'desktop/main.cjs'},null,2));
const icon=resolve('public/icon.ico');if(!existsSync(icon))throw Error('A verified multi-resolution public/icon.ico is required before installer production.');
const paths=await packager({dir:stage,out:join(owned,'out'),name:'JacksonChung',platform:'win32',arch:'x64',electronVersion:pkg.devDependencies.electron,appVersion:version,overwrite:false,icon,prune:false,asar:{unpackDir:'desktop'},win32metadata:{CompanyName:'Ding Ding Projects',FileDescription:'Jackson Chung local companion',ProductName:'Jackson Chung'}});
const appDirectory=paths[0];
cpSync(assets.gitRoot,join(appDirectory,'resources','tools','git'),{recursive:true});
cpSync(assets.launcher,join(appDirectory,'JacksonChungNativeHost.exe'));
cpSync(assets.config,join(appDirectory,'native-host-config.json'));
for(const name of ['native-host.cjs','bridge.cjs','security.cjs']){if(!existsSync(join(appDirectory,'resources','app.asar.unpacked','desktop',name)))throw Error(`Native host unpacked module is missing: ${name}`);}
const output=join(owned,'release');mkdirSync(output);
const require=createRequire(import.meta.url);
const installerRoot=resolve(require.resolve('electron-winstaller/package.json'),'..');
if(!existsSync(join(installerRoot,'vendor','7z.exe'))||!existsSync(join(installerRoot,'vendor','7z.dll'))){execFileSync(process.execPath,[join(installerRoot,'script','select-7z-arch.js')],{cwd:installerRoot,stdio:'inherit',windowsHide:true,timeout:30000});}
if(!existsSync(join(installerRoot,'vendor','7z.exe'))||!existsSync(join(installerRoot,'vendor','7z.dll')))throw Error('Official electron-winstaller architecture selection did not produce 7-Zip payloads.');
await installer.createWindowsInstaller({appDirectory,outputDirectory:output,authors:'Jackson Chung',exe:'JacksonChung.exe',name:'JacksonChung',version,description:pkg.description,setupExe:'Setup.exe',setupIcon:icon,noMsi:true,signWithParams:undefined});
for(const name of ['Setup.exe','RELEASES',`JacksonChung-${version}-full.nupkg`])if(!existsSync(join(output,name)))throw Error(`Squirrel output missing: ${name}`);
mkdirSync('release',{recursive:true});cpSync(output,resolve('release'),{recursive:true});
writeFileSync(join(owned,'payload-receipt.json'),JSON.stringify({version,...assets.receipt,installerProduced:true,installedRuntimeVerified:false},null,2));
console.log(`Unsigned Squirrel.Windows installer produced for ${version}. Native installation and extension registration remain separate verification steps.`);
console.log(`Packaged application directory: ${appDirectory}`);
