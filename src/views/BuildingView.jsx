import { lazy, Suspense } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import SceneSkeleton from "./SceneSkeleton";
import StatusLegend from "./StatusLegend";
import {
  countByStatus,
  getBuilding,
  levelBase,
  levelHeight,
} from "../data/buildingSource";
import { Link } from "../router/Link";
import { navigate, urls } from "../router/router";
import { ACCENT, statusStyle } from "../theme";
import { floorStatus } from "../three/buildTower";

// three.js only loads on this route.
const BuildingScene = lazy(() => import("../three/BuildingScene"));

/** Building entry point: pick a floor off the 3D model. */
export default function BuildingView() {
  const building = getBuilding();
  const goToFloor = (floorId) => navigate(urls.floors(building.id, floorId));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to={urls.map()}
        className="mb-4 inline-flex items-center gap-1.5 text-xs"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <ArrowLeft size={13} />
        Implantación
      </Link>

      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
          Showroom virtual
        </p>
        <h1 className="mt-1 text-2xl font-medium text-white">{building.name}</h1>
        <div
          className="mt-1 flex items-center gap-1 text-xs"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <MapPin size={12} />
          <span>{building.location}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Suspense fallback={<SceneSkeleton label="Cargando el modelo 3D…" />}>
          <BuildingScene
            floors={building.floors}
            levelBase={levelBase}
            levelHeight={levelHeight}
            onSelectFloor={goToFloor}
          />
        </Suspense>

        <aside className="flex flex-col gap-3">
          <StatusLegend counts={countByStatus(building.floors.flatMap((f) => f.units))} />
          <ul className="flex flex-col gap-1.5">
            {building.floors.map((floor) => {
              const counts = countByStatus(floor.units);
              const style = statusStyle(floorStatus(floor));
              return (
                <li key={floor.id}>
                  <button
                    type="button"
                    onClick={() => goToFloor(floor.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <span className="text-sm text-white">{floor.label}</span>
                    <span className="text-[11px]" style={{ color: style.color }}>
                      {counts.disponible ?? 0} de {floor.units.length} libres
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
