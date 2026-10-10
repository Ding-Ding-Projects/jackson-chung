import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,mkdtempSync,statSync,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable,Transform} from 'node:stream';
import {resolve,join,isAbsolute,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {unzipSync} from 'fflate';

const asset='MinGit-2.51.0-64-bit.zip';
const expectedSize=41268410;
const expectedHash='c2c955a21fa99889d83f485f24fa5d9a38fffc2d509d4022385510e11c26b250';
async function dotnetSdk(cache){
 const candidates=['dotnet',join(process.env.ProgramFiles??'C:/Program Files','dotnet','dotnet.exe')];
 const version='8.0.414';
 const hash='ae86d5d9aeff5be9db7e306e0f85f708a41cd611f3cbef99ce60a3fe48c19d18fa1137d8f632d959ebc2b032e594b6970850581dd0e2afe64b9842d59899d2d6';
 const sdkRoot=join(cache,`dotnet-sdk-${version}`);const portable=join(sdkRoot,'dotnet.exe');candidates.push(portable);
 for(const candidate of candidates){try{const sdks=execFileSync(candidate,['--list-sdks'],{encoding:'utf8',windowsHide:true,timeout:30000});if(sdks.split(/\r?\n/).some(line=>/^(8|9|10)\.\d+\./.test(line)))return candidate;}catch{}}
 const metadataResponse=await fetch('https://builds.dotnet.microsoft.com/dotnet/release-metadata/8.0/releases.json',{redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!metadataResponse.ok)throw Error('Official .NET release metadata unavailable.');
 if(!metadataResponse.body)throw Error('Official .NET metadata body unavailable.');const reader=metadataResponse.body.getReader();let metadataBytes=0;const parts=[];try{while(true){const {value,done}=await reader.read();if(done)break;metadataBytes+=value.byteLength;if(metadataBytes>4*1024*1024)throw Error('Official .NET metadata exceeds bound.');parts.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}const metadataText=Buffer.concat(parts).toString('utf8');
 const metadata=JSON.parse(metadataText);const sdk=metadata.releases.flatMap(release=>release.sdks??[release.sdk]).find(item=>item?.version===version);
 const file=sdk?.files.find(item=>item.rid==='win-x64'&&item.name.endsWith('.zip'));
 const url=`https://builds.dotnet.microsoft.com/dotnet/Sdk/${version}/dotnet-sdk-${version}-win-x64.zip`;
 if(file?.url!==url||file?.hash!==hash)throw Error('Pinned official .NET SDK metadata mismatch.');
 const archive=join(cache,`dotnet-sdk-${version}-win-x64.zip`);
 if(!existsSync(archive)){const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(600000)});if(!response.ok||!response.body)throw Error('Official .NET SDK download unavailable.');let total=0;await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,_encoding,callback){total+=chunk.length;callback(total>400*1024*1024?Error('SDK archive exceeds bound'):null,chunk)}}),createWriteStream(archive,{flags:'wx'}));}
 if(statSync(archive).size>400*1024*1024||createHash('sha512').update(readFileSync(archive)).digest('hex')!==hash)throw Error('Pinned .NET SDK SHA-512 mismatch. Cached bytes retained for diagnosis.');
 mkdirSync(sdkRoot,{recursive:true});execFileSync('tar.exe',['-xf',archive,'-C',sdkRoot],{stdio:'inherit',windowsHide:true,timeout:300000});
 if(!execFileSync(portable,['--list-sdks'],{encoding:'utf8',windowsHide:true,timeout:30000}).includes(version))throw Error('Portable .NET SDK readback failed.');
 return portable;
}
export async function prepareAssets(root){
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
 const dotnet=await dotnetSdk(cache);
 const publish=mkdtempSync(join(root,'native-launcher-'));
 execFileSync(dotnet,['publish',resolve('desktop/native-host-launcher/NativeHost.csproj'),'-c','Release','-r','win-x64','--self-contained','true','-p:PublishSingleFile=true','-p:EnableWindowsTargeting=true','-o',publish],{stdio:'inherit',windowsHide:true,timeout:600000});
 const launcher=join(publish,'JacksonChungNativeHost.exe');if(!existsSync(launcher)||statSync(launcher).size<1000000)throw Error('Self-contained native host executable was not produced.');
 const config=join(root,'native-host-config.json');writeFileSync(config,JSON.stringify({extensionId},null,2));
 return {gitRoot,launcher,config,extensionId,receipt:{git:{asset,size:bytes.length,sha256:expectedHash,version},launcher:{sha256:createHash('sha256').update(readFileSync(launcher)).digest('hex'),size:statSync(launcher).size},extensionId}};
}
