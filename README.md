# Claude Video Skills

Un repositorio base para crear skills o workflows de IA que ayuden a producir videos usando Claude como orquestador y herramientas externas para la generación, edición y postproducción.

## Qué incluye

- Guion y storyboard para videos
- Prompts listos para modelos de video
- Scripts de automatización
- Estructura para conectar Claude con:
  - Runway
  - Pika
  - Kling
  - ElevenLabs
  - Whisper
  - FFmpeg
  - MoviePy

## Estructura

- `docs/skills.md` — catálogo de skills
- `scripts/storyboard_prompt.py` — genera un prompt de storyboard a partir de una idea
- `scripts/render_video.sh` — template para render y exportación
- `README.md` — documentación principal

## Flujo recomendado

1. Claude crea el guion y la estructura de escenas.
2. Se genera un prompt para video por escena.
3. Un modelo de video genera los clips.
4. Se editan y compone con FFmpeg/MoviePy.
5. Se agregan voz y subtítulos.

## Ejemplo de uso

```bash
python3 scripts/storyboard_prompt.py "video corto sobre una ciudad futurista"
```

## Requisitos

- Python 3.10+
- FFmpeg (opcional, para render)
- Acceso a un servicio de video o API externa

## Ideas de skills

- `storyboard_skill`
- `scene_prompt_skill`
- `voiceover_skill`
- `subtitle_skill`
- `render_video_skill`

## Objetivo

Este proyecto sirve como base para automatizar la parte creativa y operativa de producción de videos con Claude + herramientas externas.
