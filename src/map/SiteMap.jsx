import { useEffect, useRef, useState } from "react";
// maplibre-gl 6 ships named exports only; `Map` is aliased to keep the global.
import { Map as MapLibreMap, NavigationControl, ScaleControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ACCENT } from "../theme";

// CARTO's dark basemap: vector tiles, no API key, attribution rendered by
// MapLibre from the style's own sources. Its `building` layer carries
// render_height, which is what makes the surrounding city extrudable.
const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const CITY_LAYER = "osm-buildings-3d";
const PROJECT_SOURCE = "project-site";
const PROJECT_LAYER = "project-massing";

/** Id of the first symbol layer, so extrusions stay under the labels. */
function firstSymbolLayer(map) {
  return map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
}

/** Extrude the basemap's building footprints using their OSM heights. */
function addCityBuildings(map) {
  ["building", "building-top"].forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
  });

  map.addLayer(
    {
      id: CITY_LAYER,
      type: "fill-extrusion",
      source: "carto",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], 9],
          0,
          "#232B30",
          40,
          "#39444B",
        ],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 9],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.92,
      },
    },
    firstSymbolLayer(map),
  );
}

/** Add the project volume and return nothing; interaction is wired by caller. */
function addProject(map, site, heightMeters) {
  map.addSource(PROJECT_SOURCE, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [site.footprint] },
    },
  });

  map.addLayer({
    id: PROJECT_LAYER,
    type: "fill-extrusion",
    source: PROJECT_SOURCE,
    paint: {
      "fill-extrusion-color": ACCENT,
      "fill-extrusion-height": heightMeters,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.92,
      "fill-extrusion-vertical-gradient": true,
    },
  });

  map.addLayer({
    id: `${PROJECT_LAYER}-outline`,
    type: "line",
    source: PROJECT_SOURCE,
    paint: { "line-color": "#8FF0C4", "line-width": 2, "line-opacity": 0.8 },
  });
}

/**
 * Interactive site map: the real city in 3D with the project standing in it.
 *
 * Pan, zoom, rotate and tilt are all live — right-drag or ctrl-drag changes the
 * bearing and pitch.
 */
export default function SiteMap({ site, name, heightMeters, onSelect }) {
  const holderRef = useRef(null);
  const mapRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!holderRef.current) return undefined;

    const map = new MapLibreMap({
      container: holderRef.current,
      style: STYLE_URL,
      center: site.center,
      zoom: 16.2,
      pitch: 56,
      bearing: site.bearing ?? 0,
      antialias: true,
      // The wheel should zoom straight away; requiring Ctrl fights the point of
      // an explorable site map.
      cooperativeGestures: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new ScaleControl({ maxWidth: 90, unit: "metric" }), "bottom-left");

    map.on("error", (event) => {
      // A failed tile is not fatal; a failed style is.
      if (event?.error && !map.isStyleLoaded()) setFailed(true);
    });

    // `load` only fires once the first frame has actually been painted, which
    // never happens on software GL. Hooking the style instead means the layers
    // and interactions are wired as soon as they legally can be.
    let wired = false;
    const wire = () => {
      if (wired || !map.isStyleLoaded()) return;
      wired = true;
      addCityBuildings(map);
      addProject(map, site, heightMeters);
      setReady(true);

      map.on("click", PROJECT_LAYER, () => onSelectRef.current?.());
      map.on("mouseenter", PROJECT_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", PROJECT_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });
    };
    map.on("styledata", wire);
    map.on("load", wire);

    // Keep the GL drawing buffer in step with the element.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(holderRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [site, heightMeters]);

  const resetView = () => {
    mapRef.current?.easeTo({
      center: site.center,
      zoom: 16.2,
      pitch: 56,
      bearing: site.bearing ?? 0,
      duration: 900,
    });
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        // An explicit height, not an aspect ratio: a WebGL canvas needs a sized
        // container at construction time.
        height: "clamp(380px, 56vh, 640px)",
        background: "#0E1214",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div ref={holderRef} className="absolute inset-0" />

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            No se pudo cargar la cartografía. Revisá la conexión: el mapa se sirve
            desde CARTO en tiempo real.
          </p>
        </div>
      )}

      {ready && (
        <button
          type="button"
          onClick={resetView}
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          Centrar en {name}
        </button>
      )}
    </div>
  );
}
