#!/usr/bin/env bash
# Build the site map from real OpenStreetMap tiles.
#
#   tiles -> composite -> dark treatment -> project volume -> public/building/map.webp
#
# and write the volume's clickable silhouette into building.json as `mapHotspot`.
#
# Data: © OpenStreetMap contributors, ODbL. Attribution is rendered in the app
# (see MapView) and recorded in ATTRIBUTION.md. Only 16 tiles are fetched, well
# inside the tile usage policy; re-run sparingly.
#
# Requires ffmpeg and Chrome. Usage: bash scripts/build-map.sh [lat] [lon] [zoom]
set -euo pipefail

LAT="${1:-4.7280}"
LON="${2:--74.0450}"
ZOOM="${3:-16}"
GRID=4
UA="AndesGT-showroom-prototype/1.0 (jrojas@andesgt.com)"

# node and Chrome are native Windows binaries and cannot resolve Git Bash paths
# like /c/... or /tmp/..., so every path handed to them is converted first.
# `cygpath -m` output (C:/foo) is accepted by Git Bash too, so one form serves both.
native() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else printf '%s' "$1"; fi; }

ROOT="$(native "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
WORK="$(native "$(mktemp -d)")"
trap 'rm -rf "$WORK"' EXIT

CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
command -v ffmpeg >/dev/null || { echo "ffmpeg no está en el PATH"; exit 1; }
[ -x "$CHROME" ] || { echo "No encuentro Chrome en: $CHROME"; exit 1; }

echo "[1/5] Calculando tiles para $LAT,$LON z$ZOOM…"
node -e "
const [lat,lon,z,grid]=[$LAT,$LON,$ZOOM,$GRID];
const n=2**z, latRad=lat*Math.PI/180;
const cx=Math.floor((lon+180)/360*n);
const cy=Math.floor((1-Math.log(Math.tan(latRad)+1/Math.cos(latRad))/Math.PI)/2*n);
const x0=cx-Math.floor(grid/2), y0=cy-Math.floor(grid/2);
const rows=[];
for(let dy=0;dy<grid;dy++)for(let dx=0;dx<grid;dx++)rows.push([dy*grid+dx,z,x0+dx,y0+dy].join(' '));
require('fs').writeFileSync('$WORK/list.txt', rows.join('\n')+'\n');
"

echo "[2/5] Obteniendo $((GRID*GRID)) tiles de OpenStreetMap…"
# Tiles are cached so re-running to tweak the volume never re-hits the tile
# server, which their usage policy asks for.
CACHE="$ROOT/.cache/osm-tiles"
mkdir -p "$CACHE"
hits=0
misses=0
while read -r i z x y; do
  cached="$CACHE/${z}_${x}_${y}.png"
  if [ ! -s "$cached" ]; then
    curl -sS -m 25 -A "$UA" -o "$cached" "https://tile.openstreetmap.org/$z/$x/$y.png"
    misses=$((misses + 1))
  else
    hits=$((hits + 1))
  fi
  cp "$cached" "$WORK/t$(printf %02d "$i").png"
done < "$WORK/list.txt"
echo "      $hits en caché · $misses descargados"

echo "[3/5] Componiendo y aplicando tema oscuro…"
ffmpeg -y -v error -start_number 0 -i "$WORK/t%02d.png" -vf "tile=${GRID}x${GRID}" \
  -frames:v 1 "$WORK/base.png"
# Invert then re-tint: turns the light OSM style into a dark basemap that keeps
# street names legible, instead of just dimming everything into mud.
ffmpeg -y -v error -i "$WORK/base.png" -vf \
  "crop=1024:680:0:180,hue=s=0.30,eq=brightness=-0.10:contrast=1.05,negate,hue=s=0.55:h=150,eq=brightness=-0.06:contrast=0.92,colorbalance=bs=0.06:gs=0.04" \
  "$WORK/dark.png"

echo "[4/5] Superponiendo el volumen del proyecto…"
node --input-type=module -e "
import { massingSvg, MAP_FRAME } from 'file:///$ROOT/scripts/mapMassing.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const b = JSON.parse(readFileSync('$ROOT/src/data/building.json','utf8'));
const svg = massingSvg(b.name, b.floors.length);
writeFileSync('$WORK/compose.html', \`<style>html,body{margin:0;padding:0}
.f{position:relative;width:\${MAP_FRAME.w}px;height:\${MAP_FRAME.h}px}
.f img,.f svg{position:absolute;inset:0;width:100%;height:100%}</style>
<div class=f><img src=\"dark.png\"><svg viewBox=\"0 0 \${MAP_FRAME.w} \${MAP_FRAME.h}\">\${svg}</svg></div>\`);
"
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --user-data-dir="$WORK/chrome" --window-size=1024,680 \
  --screenshot="$WORK/map.png" "file:///$WORK/compose.html" \
  >/dev/null 2>&1

mkdir -p "$ROOT/public/building"
ffmpeg -y -v error -i "$WORK/map.png" -quality 82 "$ROOT/public/building/map.webp"

echo "[5/5] Escribiendo mapHotspot…"
node --input-type=module -e "
import { silhouette } from 'file:///$ROOT/scripts/mapMassing.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const p = '$ROOT/src/data/building.json';
const b = JSON.parse(readFileSync(p,'utf8'));
b.mapImage = '/building/map.webp';
b.mapHotspot = silhouette();
b.mapAttribution = '© OpenStreetMap contributors';
writeFileSync(p, JSON.stringify(b,null,2)+'\n');
console.log('mapHotspot:', JSON.stringify(b.mapHotspot));
"

echo
echo "Listo: public/building/map.webp ($(du -h "$ROOT/public/building/map.webp" | cut -f1))"
