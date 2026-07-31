# Atribución de recursos de terceros

## Cartografía — OpenStreetMap

`public/building/map.webp` se construye a partir de tiles de OpenStreetMap
(ver `scripts/build-map.sh`).

- **Datos:** © OpenStreetMap contributors
- **Licencia:** [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
- **Uso comercial:** permitido, con atribución
- **Obligación:** el crédito debe permanecer visible junto al mapa. Está
  renderizado en `MapView` y guardado en `building.json` como `mapAttribution`.

El script cachea los tiles en `.cache/osm-tiles/` para no repetir descargas, y
solo pide 16 tiles por corrida — dentro de la
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
Si el showroom pasa a producción con tráfico real, migrar a un proveedor de
tiles con plan comercial (MapTiler, Mapbox, Stadia) o a un servidor propio: la
policy de OSM no cubre uso de producción.

## Recursos generados

Todo lo demás en `public/building/` lo genera
`scripts/generate-placeholder-assets.mjs` y no tiene dependencias de terceros:

- `exterior.svg` — render esquemático del edificio
- `floors/*.svg` — plantas axonométricas

## Recorrido 3D

`public/tour/` se genera con `scripts/build-tour.sh` desde el render de video
provisto por el cliente. No hay material de terceros.

## Pendiente

Los assets del edificio son **placeholder generado**. El render real y las
plantas reales del proyecto tienen que reemplazarlos antes de publicar: mostrar
un volumen genérico rotulado "Bosques del Norte" sirve para prototipar, no para
material de venta.
