// Convierte resources/icon.svg y resources/splash.svg a PNG usando sharp.
// Uso: node resources/generate-png.mjs
//
// Después corre `npx @capacitor/assets generate` para que Capacitor genere
// todos los tamaños específicos de cada plataforma (Android + iOS).

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function convert(inputName, outputName, size) {
  const input = join(__dirname, inputName);
  const output = join(__dirname, outputName);
  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(output);
  console.log(`✓ ${outputName}  (${size}×${size})`);
}

console.log('Generando PNGs de íconos…');
await convert('icon.svg', 'icon.png', 1024);
await convert('icon.svg', 'icon-foreground.png', 1024);
await convert('icon.svg', 'icon-background.png', 1024);
await convert('splash.svg', 'splash.png', 2732);
await convert('splash.svg', 'splash-dark.png', 2732);
console.log('✓ Listo. Ahora corre: npx @capacitor/assets generate');
