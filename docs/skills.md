# Skills para video con Claude

## 1. storyboard_skill

Objetivo: convertir una idea en estructura de escenas.

Entrada:
- Tema principal
- Duración deseada
- Estilo visual
- Público objetivo

Salida:
- Guion con introducción, desarrollo y cierre
- Lista de escenas con duración
- Descripción visual de cada toma

## 2. scene_prompt_skill

Objetivo: transformar cada escena en un prompt listo para modelos de video.

Ejemplo:
- estilo cinematográfico
- cámara lenta
- iluminación dramática
- movimiento suave
- imagen 16:9

## 3. voiceover_skill

Objetivo: preparar texto de voz para locución.

Salida:
- versión corta
- versión natural
- versión casi narrativa
- tiempos de lectura por escena

## 4. subtitle_skill

Objetivo: generar subtítulos sincronizados.

Uso recomendado:
- Whisper para transcripción
- FFmpeg para hardcode subtitles
- exportación a SRT/VTT

## 5. render_video_skill

Objetivo: compilar clips en un archivo final.

Acciones:
- ordenar clips
- añadir transiciones
- mezclar audio
- exportar final en MP4

## 6. edit_pipeline_skill

Objetivo: crear un pipeline completo.

Flujo:
- script
- prompts
- generation
- edición
- voz
- subtítulos
- render final

## Recomendación práctica

No intentes que Claude haga todo en un solo paso. Mejor separa la pipeline en skills pequeñas y medibles.
