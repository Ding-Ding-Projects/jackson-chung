'use strict';
const {existsSync,readFileSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const verificationPackageId='JacksonChungVerification';
function runtimeMode(directory,appData){
  const file=path.join(directory,'runtime-mode.json');
  if(!existsSync(file))return Object.freeze({verification:false});
  const bytes=readFileSync(file);if(bytes.length>512)throw Error('Invalid runtime mode.');
  const value=JSON.parse(bytes.toString('utf8'));
  if(!value||Object.keys(value).sort().join(',')!=='mode,packageId,version'||value.version!==1||value.mode!=='verification'||value.packageId!==verificationPackageId)throw Error('Invalid runtime mode.');
  if(!path.isAbsolute(appData))throw Error('Application data root must be absolute.');
  return Object.freeze({verification:true,packageId:verificationPackageId,userData:path.join(appData,verificationPackageId)});
}
function configureRuntime(app,directory){const mode=runtimeMode(directory,app.getPath('appData'));if(mode.verification){mkdirSync(mode.userData,{recursive:true});app.setName(mode.packageId);app.setPath('userData',mode.userData);app.setPath('sessionData',mode.userData);}return mode;}
module.exports={runtimeMode,configureRuntime,verificationPackageId};
