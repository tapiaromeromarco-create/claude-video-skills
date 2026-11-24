#!/usr/bin/env node
/* Render completo en cualquier computadora (Windows, Mac o Linux).
   Requisitos: Node 20+ y ffmpeg en el PATH (Windows: winget install Gyan.FFmpeg).
   Uso (desde esta carpeta):  node render_local.mjs
   Resultado: render/video_final.mp4 (1080p, 30 fps con desenfoque de movimiento) y render/video_final_720p.mp4 */
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REM = path.join(AQUI, 'remotion');
const IN = path.join(AQUI, 'render_inputs');
const OUT = path.join(AQUI, 'render');
const run = (cmd, cwd = AQUI) => { console.log(`\n> ${cmd}`); execSync(cmd, {cwd, stdio: 'inherit'}); };

try { execSync('ffmpeg -version', {stdio: 'ignore'}); } catch {
  console.error('Falta ffmpeg. En Windows: winget install Gyan.FFmpeg   (luego abre una terminal nueva)'); process.exit(1);
}
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(path.join(REM, 'public', 'audio'), {recursive: true});

// 1) dependencias del proyecto de video
if (!fs.existsSync(path.join(REM, 'node_modules'))) run('npm ci', REM);
// 2) voz maestra para Remotion
run(`ffmpeg -hide_banner -loglevel error -y -i "${path.join(IN, 'voz_maestra.flac')}" "${path.join(REM, 'public', 'audio', 'voz_maestra.wav')}"`);
// 3) render a 60 fps (las animaciones están escritas en tiempo de 30 fps)
const hilos = Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2)));
const voz60 = path.join(OUT, 'video_voz60.mp4');
run(`npx remotion render VideoEnsayo "${voz60}" --concurrency=${hilos} --codec=h264 --crf=16`, REM);
// 4) desenfoque de movimiento (mezcla de pares de fotogramas -> 30 fps) + música con ducking + efectos
const filtro = [
  "[0:v]tmix=frames=2:weights='1 1',fps=30,format=yuv420p[vid]",
  '[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][sc]',
  '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.9[m]',
  '[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=40:release=600:makeup=1[md]',
  '[2:a]aformat=sample_rates=48000:channel_layouts=stereo[fx]',
  '[v][md][fx]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[a]',
].join(';');
const final = path.join(OUT, 'video_final.mp4');
run(`ffmpeg -hide_banner -loglevel error -y -i "${voz60}" -i "${path.join(IN, 'musica.flac')}" -i "${path.join(IN, 'sfx.flac')}" -filter_complex "${filtro}" -map "[vid]" -map "[a]" -c:v libx264 -preset medium -crf 19 -r 30 -c:a aac -b:a 192k "${final}"`);
run(`ffmpeg -hide_banner -loglevel error -y -i "${final}" -vf scale=1280:-2 -c:v libx264 -preset veryfast -crf 25 -c:a aac -b:a 128k "${path.join(OUT, 'video_final_720p.mp4')}"`);
fs.rmSync(voz60, {force: true});
console.log(`\nListo: ${final}`);
