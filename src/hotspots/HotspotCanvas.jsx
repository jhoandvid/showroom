import HotspotOverlay from "./HotspotOverlay";
import { ACCENT } from "../theme";

function clamp(value) {
  return Math.min(Math.max(value, 0), 100);
}

/** Superficie de dibujo: imagen de referencia y figuras en edición. */
export default function HotspotCanvas({
  imageUrl,
  shapes,
  draft,
  selectedId,
  onAddPoint,
  onSelect,
}) {
  const drawing = draft.length > 0;

  const addPointFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onAddPoint([
      clamp(((event.clientX - rect.left) / rect.width) * 100),
      clamp(((event.clientY - rect.top) / rect.height) * 100),
    ]);
  };

  return (
    <div
      onClick={addPointFromEvent}
      className="relative block w-full cursor-crosshair select-none overflow-hidden rounded-xl"
      style={{ background: "#111416" }}
    >
      <img src={imageUrl} alt="Imagen de referencia" className="block w-full" draggable={false} />

      {/* Las figuras guardadas dejan de capturar clics mientras se dibuja un polígono. */}
      <HotspotOverlay
        shapes={shapes.map((shape) => ({ ...shape, label: shape.label || shape.id }))}
        activeId={selectedId}
        onSelect={(shape) => onSelect(shape.id)}
        interactive={!drawing}
      />

      {drawing && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <polyline
            points={draft.map(([x, y]) => `${x},${y}`).join(" ")}
            vectorEffect="non-scaling-stroke"
            style={{ fill: "rgba(31,174,114,0.18)", stroke: ACCENT, strokeWidth: 2 }}
          />
        </svg>
      )}

      {/* Los controles son HTML para que el viewBox estirado no los vuelva elipses. */}
      {draft.map(([x, y], i) => (
        <span
          key={`${x}-${y}-${i}`}
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, background: ACCENT, boxShadow: "0 0 0 2px #04241A" }}
        />
      ))}
    </div>
  );
}
