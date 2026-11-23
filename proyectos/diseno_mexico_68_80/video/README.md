# Video: La Época de Oro del Diseño Gráfico en México (1968–1980)

Video-ensayo estilo Vox (collage editorial, papel, resaltador, recortes a 12 fps) hecho con Remotion.

## Estructura
- `timeline.json` — orden de las pistas de voz y dónde empieza cada bloque (lo genera el armado del audio).
- `words.json` — transcripción por palabra de la voz maestra (faster-whisper).
- `storyboard_src.json` — **guion visual**: cada escena anclada a una frase del audio (`"at": "@frase"`).
- `remotion/` — proyecto de video. Escenas en `src/components/scenes.tsx`, estilo en `src/theme.ts` y `src/components/base.tsx`.
- `render/` — salidas (no se suben a git).

## Cambiar un audio (p. ej. la voz de Marco)
1. Procesar la voz nueva (`scripts/voice_light.sh` o `voice_smooth.sh`) y dejarla en `audio/dialogos/proc/` con el mismo nombre (`marco_intro.wav`, `marco_mexico68.wav`, `marco_identidad.wav`, `marco_cierre.wav`).
2. Rearmar la voz maestra y `timeline.json` (bloque de Python del armado; ver historial).
3. Transcribir de nuevo → `words.json`.
4. `python3 scripts/resolve_storyboard.py storyboard_src.json timeline.json words.json remotion/src/data/storyboard.json`
   (avisa si alguna frase ancla ya no se encuentra).
5. Copiar `audio/voz_maestra.wav` a `remotion/public/audio/` y renderizar.

## Reemplazar un hueco por una foto real
En `storyboard_src.json`, al elemento correspondiente agregar `"src": "img/archivo.jpg"` y poner el archivo en `remotion/public/img/`.
Los huecos muestran "FOTO DE ARCHIVO / RETRATO / PORTADA / CARTEL / LOGOTIPO / ESTAMPILLA / MUESTRA" con su descripción.

## Render
```bash
cd remotion && npx remotion render VideoEnsayo ../render/video_voz.mp4 --concurrency=4 --crf=20
```
Luego se mezcla la música con ducking (ffmpeg `sidechaincompress`) → `render/video_final.mp4`.

## Pendiente
- Fotos de archivo, retratos, portadas, carteles, billetes y estampillas (ver `../PENDIENTES_ASSETS.md`).
- Música definitiva (la actual es una base sintetizada provisional).
- Voz final de Marco (la actual es la edición de su grabación).
