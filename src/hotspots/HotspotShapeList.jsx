import { Trash2 } from "lucide-react";
import { ACCENT, STATUS_ORDER, statusStyle } from "../theme";

const FIELD_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
};

/** Lista editable de las figuras creadas. */
export default function HotspotShapeList({
  shapes,
  mode,
  selectedId,
  onSelect,
  onUpdate,
  onRemove,
}) {
  if (shapes.length === 0) {
    return (
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        Todavía no hay zonas. Hacé clic sobre la imagen para marcar los vértices.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {shapes.map((shape) => {
        const selected = shape.id === selectedId;
        const style = statusStyle(shape.status);
        return (
          <li
            key={shape.id}
            onPointerEnter={() => onSelect(shape.id)}
            className="rounded-lg p-2"
            style={{
              background: selected ? "rgba(31,174,114,0.10)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selected ? ACCENT : "rgba(255,255,255,0.10)"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <input
                value={shape.label}
                onChange={(event) => onUpdate(shape.id, { label: event.target.value })}
                placeholder={mode === "floors" ? "id del piso" : "código de unidad"}
                className="min-w-0 flex-1 rounded px-2 py-1 text-xs outline-none"
                style={FIELD_STYLE}
              />
              <button
                type="button"
                onClick={() => onRemove(shape.id)}
                aria-label={`Eliminar zona ${shape.label || shape.id}`}
                className="shrink-0 rounded p-1"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {mode === "units" && (
                <select
                  value={shape.status}
                  onChange={(event) => onUpdate(shape.id, { status: event.target.value })}
                  className="rounded px-2 py-1 text-xs outline-none"
                  style={FIELD_STYLE}
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status} style={{ background: "#15181A" }}>
                      {statusStyle(status).label}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[11px]" style={{ color: style.color }}>
                {shape.points.length} vértices
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
