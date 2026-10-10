declare module 'qrcode' {
  type RenderOptions = {errorCorrectionLevel?:'L'|'M'|'Q'|'H';margin?:number;width?:number};
  const QRCode: {toDataURL(text:string,options?:RenderOptions):Promise<string>};
  export default QRCode;
}
