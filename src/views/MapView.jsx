import { lazy, Suspense } from "react";
import { Building2, MapPin } from "lucide-react";
import SceneSkeleton from "./SceneSkeleton";
import StatusLegend from "./StatusLegend";
import { countByStatus, getBuilding } from "../data/buildingSource";
import { navigate, urls } from "../router/router";
import { ACCENT } from "../theme";

// Load the map only on this route.
const SiteMap = lazy(() => import("../map/SiteMap"));

/** Site view: the entry point, where the project is located on an interactive map. */
export default function MapView() {
  const building = getBuilding();
  const units = building.floors.flatMap((floor) => floor.units);
  const counts = countByStatus(units);
  const open = () => navigate(urls.building(building.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
          Showroom virtual
        </p>
        <h1 className="mt-1 text-2xl font-medium text-white">Implantación</h1>
        <div
          className="mt-1 flex items-center gap-1 text-xs"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <MapPin size={12} />
          <span>{building.location}</span>
        </div>
      </div>

      <Suspense
        fallback={<SceneSkeleton label="Cargando cartografía…" height="clamp(380px, 56vh, 640px)" />}
      >
        <SiteMap
          site={building.site}
          name={building.name}
          onSelect={open}
        />
      </Suspense>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}55` }}
        >
          <Building2 size={17} style={{ color: ACCENT }} />
          <div>
            <p className="text-sm font-medium text-white">{building.name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {building.floors.length} pisos · {units.length} unidades ·{" "}
              {counts.disponible ?? 0} disponibles
            </p>
          </div>
        </button>
        <StatusLegend counts={counts} />
      </div>

      <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        Arrastrá para desplazar · usá los controles para acercar · seleccioná “Ver edificio”
        para explorar sus pisos y unidades.
      </p>
    </div>
  );
}
