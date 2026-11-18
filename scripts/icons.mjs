import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('assets/brand/app-icon.svg');
await sharp(svg).resize(512, 512).png().toFile('assets/brand/icon.png');
const mark = await readFile('assets/brand/mark.svg');
await writeFile('public/mark.svg', mark);
console.log(
  'Generated app icon and public SVG from the canonical brand assets.',
);
