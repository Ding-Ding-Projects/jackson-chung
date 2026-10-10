import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'node:fs';
const sizes=[16,24,32,48,64,128,256];
const buffers=await Promise.all(sizes.map(size=>sharp('public/monogram.svg').resize(size,size).png().toBuffer()));
writeFileSync('public/icon.ico',await pngToIco(buffers));
const social=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f6f0"/><rect x="72" y="72" width="156" height="156" rx="44" fill="#006b60"/><text x="150" y="178" text-anchor="middle" fill="white" font-family="Segoe UI,Arial,sans-serif" font-size="70" font-weight="600">JC</text><text x="72" y="344" fill="#16352f" font-family="Segoe UI,Arial,sans-serif" font-size="78" font-weight="600">Jackson Chung</text><text x="76" y="414" fill="#45655e" font-family="Segoe UI,Arial,sans-serif" font-size="32">Patient. Practical. Dependable.</text><text x="76" y="526" fill="#006b60" font-family="Segoe UI,Arial,sans-serif" font-size="25">Retail · Customer service · Merchandising</text></svg>`);
await sharp(social).png().toFile('public/social-preview.png');
console.log('Generated original vector-based application icon and social preview.');
