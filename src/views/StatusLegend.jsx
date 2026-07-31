import { STATUS_ORDER, statusStyle } from "../theme";

/** Referencia de colores para los estados comerciales, con conteos opcionales. */
export default function StatusLegend({ counts }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {STATUS_ORDER.map((status) => {
        const style = statusStyle(status);
        return (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: style.fill, border: `1px solid ${style.color}` }}
            />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              {style.label}
              {counts?.[status] != null && (
                <span style={{ color: "rgba(255,255,255,0.35)" }}> · {counts[status]}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
