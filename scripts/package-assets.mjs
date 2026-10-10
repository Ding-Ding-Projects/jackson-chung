import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,mkdtempSync,statSync} from 'node:fs';
import {resolve,join,isAbsolute,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {unzipSync} from 'fflate';

const asset='MinGit-2.51.0-64-bit.zip';
const expectedSize=41268410;
const expectedHash='c2c955a21fa99889d83f485f24fa5d9a38fffc2d509d4022385510e11c26b250';
export function prepareAssets(root){
 if(process.platform!=='win32')throw Error('Windows installer production requires Windows.');
 const manifest=JSON.parse(readFileSync(resolve('extension/manifest.json'),'utf8'));
 if(typeof manifest.key!=='string')throw Error('A stable project-owned public extension key must be present before packaging.');
 const publicKey=Buffer.from(manifest.key,'base64');
 const extensionId=createHash('sha256').update(publicKey).digest('hex').slice(0,32).split('').map(character=>String.fromCharCode(97+parseInt(character,16))).join('');
 if(extensionId!=='nmehnkibdepbhmfggkofdpngpklinahg')throw Error('Stable public extension identity mismatch.');
 const cache=resolve('.agent/downloads');mkdirSync(cache,{recursive:true});
 const archive=join(cache,asset);
 if(!existsSync(archive))execFileSync('gh',['release','download','v2.51.0.windows.1','--repo','git-for-windows/git','--pattern',asset,'--dir',cache],{stdio:'inherit',windowsHide:true,timeout:600000});
 const bytes=readFileSync(archive);
 if(bytes.length!==expectedSize||createHash('sha256').update(bytes).digest('hex')!==expectedHash)throw Error('Official MinGit archive size/hash mismatch. Cached bytes retained for diagnosis; no extraction performed.');
 const gitRoot=join(root,'tools','git');mkdirSync(gitRoot,{recursive:true});
 const entries=unzipSync(bytes);
 for(const [name,data] of Object.entries(entries)){
   if(name.includes('\\')||name.includes('\0')||name.includes(':')||name.split('/').some(part=>part==='..')||isAbsolute(name))throw Error('Unsafe MinGit archive entry.');
   const target=resolve(gitRoot,name);const rel=relative(gitRoot,target);
   if(rel.startsWith('..')||isAbsolute(rel))throw Error('MinGit archive entry escaped target.');
   if(name.endsWith('/')){mkdirSync(target,{recursive:true});continue}
   mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,data);
 }
 const git=join(gitRoot,'cmd','git.exe');if(!existsSync(git)||statSync(git).size===0)throw Error('Bundled MinGit cmd/git.exe is missing.');
 const version=execFileSync(git,['--version'],{encoding:'utf8',windowsHide:true,timeout:15000}).trim();
 if(!version.startsWith('git version 2.51.0.windows.1'))throw Error('Bundled Git version mismatch.');
 let sdks;try{sdks=execFileSync('dotnet',['--list-sdks'],{encoding:'utf8',windowsHide:true,timeout:30000})}catch{throw Error('Trusted .NET 8 SDK bootstrap is required before packaging. No SDK was found; install through the root supported bootstrap.');}
 if(!sdks.split(/\r?\n/).some(line=>line.startsWith('8.0.')))throw Error('A trusted .NET 8 SDK is required by native-host-launcher/NativeHost.csproj. Root bootstrap must obtain and verify it.');
 const publish=mkdtempSync(join(root,'native-launcher-'));
 execFileSync('dotnet',['publish',resolve('desktop/native-host-launcher/NativeHost.csproj'),'-c','Release','-r','win-x64','--self-contained','true','-p:PublishSingleFile=true','-p:EnableWindowsTargeting=true','-o',publish],{stdio:'inherit',windowsHide:true,timeout:600000});
 const launcher=join(publish,'JacksonChungNativeHost.exe');if(!existsSync(launcher)||statSync(launcher).size<1000000)throw Error('Self-contained native host executable was not produced.');
 const config=join(root,'native-host-config.json');writeFileSync(config,JSON.stringify({extensionId},null,2));
 return {gitRoot,launcher,config,extensionId,receipt:{git:{asset,size:bytes.length,sha256:expectedHash,version},launcher:{sha256:createHash('sha256').update(readFileSync(launcher)).digest('hex'),size:statSync(launcher).size},extensionId}};
}
