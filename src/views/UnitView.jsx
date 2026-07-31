import { ArrowLeft, Bath, BedDouble, Ruler } from "lucide-react";
import ShowroomViewer from "../ShowroomViewer";
import { findUnit, formatArea, formatPrice, getBuilding } from "../data/buildingSource";
import { Link } from "../router/Link";
import { urls } from "../router/router";
import { PROJECT } from "../tour/tourConfig";
import { ACCENT, statusStyle } from "../theme";

/** Métrica compacta mostrada en la fila de características de la unidad. */
function Metric({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} style={{ color: ACCENT }} />
      <div>
        <p className="text-sm text-white">{value}</p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/** Detalle de unidad: características y recorrido cuando está disponible. */
export default function UnitView({ unitCode }) {
  const building = getBuilding();
  const found = findUnit(unitCode);

  if (!found) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-white">No existe la unidad {unitCode}.</p>
        <Link to={urls.building(building.id)} className="mt-3 inline-block text-xs" style={{ color: ACCENT }}>
          Volver al edificio
        </Link>
      </div>
    );
  }

  const { unit, floor } = found;
  const style = statusStyle(unit.status);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to={urls.floors(building.id, floor.id)}
        className="mb-4 inline-flex items-center gap-1.5 text-xs"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <ArrowLeft size={13} />
        {floor.label}
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-white">Unidad {unit.code}</h1>
            <span
              className="rounded px-2 py-0.5 text-[11px] font-medium"
              style={{ background: style.fill, color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {building.name} · {floor.label} · tipo {unit.slot}
          </p>
        </div>
        {unit.status !== "vendido" && (
          <p className="text-lg font-medium" style={{ color: ACCENT }}>
            {formatPrice(unit.price)}
          </p>
        )}
      </div>

      <div
        className="mb-6 flex flex-wrap gap-8 rounded-xl px-4 py-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <Metric icon={Ruler} value={formatArea(unit.area)} label="Área privada" />
        <Metric icon={BedDouble} value={unit.bedrooms} label="Alcobas" />
        <Metric icon={Bath} value={unit.bathrooms} label="Baños" />
      </div>

      {unit.tour ? (
        <ShowroomViewer
          project={{
            ...PROJECT,
            name: building.name,
            location: building.location,
            unit: `${floor.label} · unidad ${unit.code}`,
          }}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-14 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.14)" }}
        >
          <p className="text-sm text-white">Esta unidad todavía no tiene recorrido</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Generá los assets con <code>scripts/build-tour.sh</code> y asigná el
            recorrido en <code>building.json</code>.
          </p>
        </div>
      )}
    </div>
  );
}
