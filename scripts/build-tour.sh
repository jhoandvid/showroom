#!/usr/bin/env bash
# Convierte un render de recorrido en los assets usados por el visor.
#
# Uso: bash scripts/build-tour.sh "/ruta/al/render.mp4" [salto_de_cuadros]
#
# Genera dentro de public/tour/:
#   frames/f%03d.webp  imágenes para la interacción de arrastre
#   tour.mp4           H.264 comprimido para reproducción continua
#   poster.webp        imagen de portada del video
# y reescribe src/tour/tourManifest.json para mantenerlo sincronizado.
set -euo pipefail

INPUT="${1:?Falta la ruta del render de entrada}"
# Salto de muestreo sobre los cuadros originales. Un valor de 6 convierte un
# render de 30 fps en imágenes a 5 fps: respuesta fluida sin enviar cada cuadro.
STEP="${2:-6}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/tour"
FRAMES="$OUT/frames"
FRAME_WIDTH=1024
VIDEO_WIDTH=1280

command -v ffmpeg >/dev/null || { echo "ffmpeg no está en el PATH"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe no está en el PATH"; exit 1; }

probe() {
  ffprobe -v error -select_streams v:0 -show_entries "$1" \
    -of default=noprint_wrappers=1:nokey=1 "$INPUT" | head -1
}

DURATION="$(probe format=duration)"
FPS_RAW="$(probe stream=r_frame_rate)"
SRC_HEIGHT="$(probe stream=height)"
SRC_WIDTH="$(probe stream=width)"
FPS="$(awk -v r="$FPS_RAW" 'BEGIN { split(r, p, "/"); printf "%.3f", p[1] / p[2] }')"
FRAME_HEIGHT="$(awk -v w="$FRAME_WIDTH" -v sw="$SRC_WIDTH" -v sh="$SRC_HEIGHT" \
  'BEGIN { printf "%d", int(w * sh / sw / 2) * 2 }')"

echo "Fuente : ${SRC_WIDTH}x${SRC_HEIGHT} @ ${FPS} fps · ${DURATION}s"
echo "Muestreo: cada ${STEP} frames -> ${FRAME_WIDTH}x${FRAME_HEIGHT} webp"

mkdir -p "$FRAMES"
find "$FRAMES" -name 'f*.webp' -delete

echo "[1/3] Extrayendo frames…"
ffmpeg -y -v error -i "$INPUT" \
  -vf "select='not(mod(n\,${STEP}))',scale=${FRAME_WIDTH}:-2" \
  -vsync 0 -c:v libwebp -quality 68 -compression_level 5 \
  "$FRAMES/f%03d.webp"

echo "[2/3] Comprimiendo mp4 de reproducción…"
# Se elimina el audio: estos renders no lo usan y así se reduce el peso.
ffmpeg -y -v error -i "$INPUT" -an \
  -c:v libx264 -preset slow -crf 28 -g 48 -pix_fmt yuv420p \
  -movflags +faststart -vf "scale=${VIDEO_WIDTH}:-2" "$OUT/tour.mp4"

echo "[3/3] Generando poster y manifest…"
ffmpeg -y -v error -i "$INPUT" -vf "scale=1600:-2" -frames:v 1 "$OUT/poster.webp"

FRAME_COUNT="$(find "$FRAMES" -name 'f*.webp' | wc -l | tr -d ' ')"
cat > "$ROOT/src/tour/tourManifest.json" <<JSON
{
  "frameCount": $FRAME_COUNT,
  "durationSeconds": $(printf '%.3f' "$DURATION"),
  "frameWidth": $FRAME_WIDTH,
  "frameHeight": $FRAME_HEIGHT,
  "sourceFps": $FPS,
  "frameStep": $STEP
}
JSON

echo
echo "Listo. $FRAME_COUNT frames · $(du -sh "$OUT" | cut -f1) en public/tour/"
echo "Revisá los 'frame' de CHAPTERS en src/tour/tourConfig.js: son índices"
echo "de la secuencia (0..$((FRAME_COUNT - 1))), no frames del video original."
