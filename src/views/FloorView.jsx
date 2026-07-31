import { ArrowLeft } from "lucide-react";
import HotspotOverlay from "../hotspots/HotspotOverlay";
import ImageStage from "./ImageStage";
import StatusLegend from "./StatusLegend";
import {
  countByStatus,
  formatArea,
  formatPrice,
  getBuilding,
  getDefaultFloor,
  getFloor,
} from "../data/buildingSource";
import { Link } from "../router/Link";
import { navigate, urls } from "../router/router";
import { ACCENT, statusStyle } from "../theme";

/** Plano del piso con cada unidad como zona seleccionable. */
export default function FloorView({ floorId }) {
  const building = getBuilding();
  const floor = getFloor(floorId) ?? getDefaultFloor();

  if (!floor) {
    return (
      <p className="px-6 py-8 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
        Este edificio no tiene pisos cargados.
      </p>
    );
  }

  const shapes = floor.units.map((unit) => ({
    id: unit.code,
    points: unit.hotspot,
    status: unit.status,
    label: unit.code,
  }));

  const openUnit = (code) => navigate(urls.unit(building.id, code));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to={urls.building(building.id)}
        className="mb-4 inline-flex items-center gap-1.5 text-xs"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <ArrowLeft size={13} />
        {building.name}
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white">{floor.label}</h1>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {floor.units.length} unidades · {countByStatus(floor.units).disponible ?? 0} disponibles
          </p>
        </div>
        <StatusLegend counts={countByStatus(floor.units)} />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {building.floors.map((option) => {
          const active = option.id === floor.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => navigate(urls.floors(building.id, option.id))}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs"
              style={{
                background: active ? `${ACCENT}26` : "rgba(255,255,255,0.05)",
                border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.12)"}`,
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ImageStage
          src={floor.planImage}
          alt={`Planta del ${floor.label}`}
          ratio="4 / 3"
          note="Falta la planta de este piso. Las zonas se muestran sobre este marcador."
        >
          <HotspotOverlay shapes={shapes} onSelect={(shape) => openUnit(shape.id)} />
        </ImageStage>

        <aside className="flex flex-col gap-2">
          {floor.units.map((unit) => {
            const style = statusStyle(unit.status);
            const sold = unit.status === "vendido";
            return (
              <button
                key={unit.code}
                type="button"
                onClick={() => openUnit(unit.code)}
                className="rounded-lg p-3 text-left"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${sold ? "rgba(255,255,255,0.10)" : `${style.color}55`}`,
                  opacity: sold ? 0.65 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">Unidad {unit.code}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: style.fill, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {formatArea(unit.area)} · {unit.bedrooms} alcobas · {unit.bathrooms} baños
                </p>
                {!sold && (
                  <p className="mt-1 text-xs font-medium" style={{ color: ACCENT }}>
                    {formatPrice(unit.price)}
                  </p>
                )}
              </button>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
