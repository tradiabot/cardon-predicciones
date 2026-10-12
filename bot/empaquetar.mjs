// Empaqueta bot/src/nucleo.ts en app/web/nucleo.js (window.NUCLEO) y copia app/web a la app Android.
import { build } from 'esbuild';
import { cpSync, rmSync } from 'node:fs';

await build({
  entryPoints: ['src/nucleo.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'NUCLEO',
  target: 'es2019',
  outfile: '../app/web/nucleo.js',
  banner: { js: '/* Generado con «npm run app» desde bot/src. No lo edites a mano. */' },
});
const destino = '../app/android/app/src/main/assets/web';
rmSync(destino, { recursive: true, force: true });
cpSync('../app/web', destino, { recursive: true });
console.log('app/web/nucleo.js listo y copiado a la app Android');
