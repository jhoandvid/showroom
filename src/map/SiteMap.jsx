import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./SiteMap.css";

const INITIAL_ZOOM = 16;
const BUILDING_ICON = L.icon({
  iconUrl: "/map/project-building.png",
  iconSize: [78, 200],
  iconAnchor: [39, 194],
  tooltipAnchor: [0, 10],
  className: "project-building-marker",
});

/** Interactive raster map with a georeferenced architectural marker. */
export default function SiteMap({ site, name, onSelect }) {
  const holderRef = useRef(null);
  const mapRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  onSelectRef.current = onSelect;

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return undefined;

    const [longitude, latitude] = site.center;
    const center = [latitude, longitude];
    const map = L.map(holder, {
      center,
      zoom: INITIAL_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, maxWidth: 100 }).addTo(map);

    let tileErrors = 0;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });
    tiles.on("load", () => {
      setFailed(false);
      setReady(true);
    });
    tiles.on("tileerror", () => {
      tileErrors += 1;
      if (tileErrors >= 2) setFailed(true);
    });
    tiles.addTo(map);

    const building = L.marker(center, {
      icon: BUILDING_ICON,
      keyboard: true,
      riseOnHover: true,
      title: `Ver ${name}`,
      alt: `Edificio ${name}`,
    }).addTo(map);
    building.bindTooltip(name, {
      permanent: true,
      direction: "bottom",
      opacity: 1,
      className: "project-building-label",
    });
    building.on("click", () => onSelectRef.current?.());

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(holder);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [site.center, name]);

  const resetView = () => {
    const [longitude, latitude] = site.center;
    mapRef.current?.flyTo([latitude, longitude], INITIAL_ZOOM, { duration: 0.8 });
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        height: "clamp(380px, 56vh, 640px)",
        background: "#D9DDD8",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div ref={holderRef} className="absolute inset-0" />

      {!ready && !failed && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#D9DDD8] text-xs text-[#28332F]">
          Cargando cartografía...
        </div>
      )}

      {failed && (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-lg bg-[#101617]/90 px-4 py-3 text-center text-xs text-white">
          No se pudieron cargar los tiles del mapa. Revisá la conexión.
        </div>
      )}

      {ready && (
        <button
          type="button"
          onClick={resetView}
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-medium shadow-md"
          style={{ background: "rgba(13,17,19,0.86)", color: "#fff" }}
        >
          Centrar en {name}
        </button>
      )}
    </div>
  );
}