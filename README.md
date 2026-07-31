# Showroom Virtual — Frontend

Showroom inmobiliario con navegación **edificio → piso → unidad** y recorrido 3D
por unidad. El render de video se convierte en un recorrido navegable: el
visitante arrastra para avanzar por el apartamento.

## Correr en local

```bash
npm install
npm run dev
```

| Ruta | Vista |
|---|---|
| `/` | Implantación: el proyecto sobre el mapa del sector |
| `/buildings/166` | Render del edificio, pisos clicables |
| `/buildings/166/floors?floor=756` | Planta axonométrica, unidades clicables |
| `/buildings/166/units/703` | Ficha de la unidad + recorrido 3D |
| `/editor` | Editor de hotspots (herramienta interna) |

El recorrido va mapa → edificio → piso → unidad, con navegación hacia atrás en
cada nivel.

## El recorrido 3D

El visor tiene dos capas sobre el mismo render:

| Capa | Archivo | Para qué |
|---|---|---|
| Secuencia de stills | `public/tour/frames/f001.webp…` | Arrastre. Responde al instante porque cada frame ya está decodificado. |
| Video comprimido | `public/tour/tour.mp4` | Reproducción continua a 30 fps al presionar play. |

Arrastrar sobre un `<video>` no sirve: el H.264 solo tiene keyframes cada varios
segundos, así que cada `seek` salta y tarda. Por eso el arrastre va contra la
secuencia de imágenes y el video solo se usa para reproducir.

Los frames se cargan en dos pasadas: primero uno de cada ocho —el visor queda
usable con ~13% del peso— y después el resto en segundo plano. Mientras falta un
frame se muestra el vecino más cercano.

**Interacción:** arrastre horizontal, rueda del mouse, flechas `← →`,
`PageUp`/`PageDown`, `Home`/`End`, barra de progreso con marcas de capítulo, y
play (cualquier arrastre lo pausa y toma control).

### Regenerar los assets desde un render nuevo

Requiere ffmpeg en el PATH (`winget install Gyan.FFmpeg`).

```bash
bash scripts/build-tour.sh "/ruta/al/render.mp4"     # muestreo default: 1 de cada 6
bash scripts/build-tour.sh render.mp4 4              # más fluido, más peso
bash scripts/build-tour.sh render.mp4 10             # menos peso, más escalonado
```

El script extrae los frames, comprime el mp4, genera el poster y reescribe
`src/tour/tourManifest.json` con la cantidad real de frames y la duración, así
la config nunca queda desincronizada de lo que hay en disco.

Referencia del render actual: 40 s a 1280x720 (62.9 MB) → 201 frames webp
(5.3 MB) + mp4 de 10.5 MB.

Los capítulos (`CHAPTERS` en `src/tour/tourConfig.js`) se ajustan a mano. `frame`
es un **índice de la secuencia**, no un frame del video original:
`frame = segundo / duración * (frameCount - 1)`.

## Hotspots

Las zonas clicables son polígonos SVG con coordenadas en **porcentaje** de la
caja de la imagen, así que sobreviven cualquier resize sin recalcular nada.

Un detalle que importa: el contenedor se dimensiona **a la imagen**
(`ImageStage` deja que la imagen defina el alto), no la imagen al contenedor. Con
`object-fit: contain` la imagen quedaría con bandas y los porcentajes
apuntarían al lugar equivocado.

### Editor de hotspots

`/editor` — carga la imagen de referencia, hacé clic en cada vértice y copiá el
JSON resultante. Nadie escribe estas coordenadas a mano.

| Tecla | Acción |
|---|---|
| clic | agrega un vértice |
| `Enter` | cierra la zona (mínimo 3 puntos) |
| `Backspace` | borra el último punto |
| `Esc` | cancela la zona en curso |

El selector **Unidades / Pisos** cambia el formato de salida: unidades exportan
`code` + `status`, pisos exportan `id`. Pegás el resultado en
`src/data/building.json`.

## Datos

Todo vive en `src/data/building.json` y se lee a través de
`src/data/buildingSource.js` — las vistas nunca tocan el JSON directo, así que
mover el estado comercial a la API FastAPI es cambiar un solo archivo.

```json
{
  "id": 166,
  "name": "Bosques del Norte",
  "mapImage": "/building/map.svg",
  "mapHotspot": [[51.2, 15.46], "… silueta del volumen sobre el mapa"],
  "exteriorImage": "/building/exterior.svg",
  "floors": [
    {
      "id": 756, "level": 7, "label": "Piso 7",
      "planImage": "/building/floors/756.svg",
      "hotspot": [[26, 26.5], [74, 26.5], [74, 35], [26, 35]],
      "units": [
        {
          "code": "703", "slot": "C", "area": 74.8,
          "bedrooms": 3, "bathrooms": 2,
          "status": "disponible", "price": 431000000,
          "tour": "duplex-123",
          "planBox": [15, 51, 49, 80],
          "hotspot": [[33.6, 44.5], "… proyección generada desde planBox"]
        }
      ]
    }
  ]
}
```

- `status`: `disponible` · `reservado` · `vendido` (colores en `src/theme.js`)
- `tour`: `null` si la unidad todavía no tiene recorrido — la ficha lo indica
- Los datos actuales son **placeholder generado** (8 pisos × 4 unidades) hasta
  que entren el render, las plantas y el listado real.

### El mapa: cartografía real de OpenStreetMap

```bash
bash scripts/build-map.sh                      # Cedritos, Bogotá (default)
bash scripts/build-map.sh 4.65 -74.06 16       # otra ubicación
```

Baja 16 tiles de OSM, los compone, les aplica un tratamiento oscuro para que
peguen con el tema de la app, superpone el volumen del proyecto y escribe
`mapHotspot` en `building.json`. Requiere ffmpeg y Chrome.

El tratamiento oscuro **invierte** el estilo claro de OSM y lo vuelve a teñir, en
vez de solo bajarle el brillo: así los nombres de calle siguen legibles.

Los tiles quedan en `.cache/osm-tiles/` (gitignored), así que iterar sobre el
volumen no vuelve a pegarle al servidor de tiles.

> **Licencia:** © OpenStreetMap contributors, ODbL. El crédito tiene que quedar
> visible junto al mapa — está en `MapView`. Ver [ATTRIBUTION.md](ATTRIBUTION.md);
> incluye qué hacer antes de ir a producción con tráfico real.

La geometría del volumen vive en `scripts/mapMassing.mjs`: de ahí salen tanto el
SVG que se dibuja como la silueta clicable, que es lo que los mantiene alineados.

### Edificio y plantas: assets generados

```bash
node scripts/generate-placeholder-assets.mjs
```

```
public/building/exterior.svg       fachada con muro cortina, balcones y contexto
public/building/floors/<id>.svg    planta axonométrica por piso (750…757)
```

Los dos scripts son independientes: `build-map.sh` es dueño de `mapImage` y
`mapHotspot`; `generate-placeholder-assets.mjs` es dueño de `exteriorImage`,
`planImage` y los `hotspot` de unidad. No se pisan y el orden no importa.

El script deriva la geometría de **los mismos datos** de `building.json`, así que
cada banda de piso y cada unidad dibujada calza exacto con su zona clicable. Son
SVG a propósito: pesan ~60 KB en total y se ven nítidos en cualquier tamaño.

Las plantas se dibujan en **axonometría** para que se lean como parte del render
en vez de un plano plano. Eso implica que los hotspots de unidad son
paralelogramos, no rectángulos, y por eso `planBox` es la fuente de verdad:

```
planBox  [x1, y1, x2, y2]   rectángulo en espacio de planta — lo que editás
hotspot  [[x,y] × 4]        su proyección axonométrica — generado, no editar
```

El script proyecta `planBox` a `hotspot` en cada corrida, así que es idempotente:
correrlo dos veces da el mismo resultado.

Cuando lleguen los assets reales, reemplazá las rutas en `building.json`, corré
el editor para marcar los hotspots sobre las imágenes nuevas y borrá este script.
Si una imagen falta, la vista muestra un marcador con la ruta esperada y los
hotspots siguen clicables.

## Build y deploy

```bash
npm run build
npm run preview
```

**El servidor necesita fallback a `index.html`** para todas las rutas, o los
enlaces profundos como `/buildings/166/floors` devuelven 404 al recargar. Vite lo
hace solo en dev; en producción configuralo:

- **S3 + CloudFront**: error 403/404 → `/index.html` con código 200
- **nginx**: `try_files $uri $uri/ /index.html;`

`public/tour/` pesa ~16 MB y se copia tal cual a `dist/`. Si vas a servir varios
proyectos, movelo a un CDN y cambiá `frameUrl`, `videoUrl` y `posterUrl` en
`tourConfig.js` por URLs absolutas.

## Estructura

```
src/
  App.jsx                   resuelve la ruta a su vista
  theme.js                  acento y colores por estado comercial
  ShowroomViewer.jsx        el visor de recorrido
  router/
    router.js               matchRoute, navigate, useRoute, urls
    Link.jsx                anchor que navega sin recargar
  data/
    building.json           edificio, pisos, unidades, hotspots
    buildingSource.js       único punto de acceso a los datos
  views/
    MapView.jsx             implantación + edificio clicable
    BuildingView.jsx        render + pisos clicables
    FloorView.jsx           planta + unidades clicables
    UnitView.jsx            ficha + recorrido
    ImageStage.jsx          imagen + overlay, con marcador si falta el asset
    StatusLegend.jsx        leyenda de estados
  hotspots/
    HotspotOverlay.jsx      polígonos interactivos sobre una imagen
    HotspotEditor.jsx       herramienta de autoría (/editor)
    HotspotCanvas.jsx       superficie de dibujo
    HotspotShapeList.jsx    panel de zonas
    useHotspotDraw.js       estado del dibujo
    hotspotExport.js        formato de salida
  tour/
    tourConfig.js           capítulos y rutas de assets
    tourManifest.json       generado por build-tour.sh
    useFrameSequence.js     precarga progresiva de stills
    useScrub.js             puntero / rueda / teclado -> índice de frame
    useTourPlayback.js      capa de video y sincronía
    FrameCanvas.jsx         pinta el frame actual
    TourProgress.jsx        barra con marcas de capítulo
    TourChapters.jsx        tira de capítulos
    TourHeader.jsx          identidad y contacto
scripts/
  build-tour.sh                     render de video -> frames + mp4
  build-map.sh                      tiles de OSM -> mapa + volumen
  mapMassing.mjs                    geometría del volumen sobre el mapa
  generate-placeholder-assets.mjs   fachada y plantas axonométricas
```

## Stack

- Vite + React, sin router externo (4 rutas estáticas, ~90 líneas)
- Tailwind CSS v4 (plugin `@tailwindcss/vite`)
- lucide-react (iconos)
#   s h o w r o o m  
 