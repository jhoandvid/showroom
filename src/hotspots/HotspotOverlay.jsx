import { useState } from "react";
import { statusStyle } from "../theme";

/** Serializa puntos porcentuales en el atributo SVG `points`. */
function toPoints(points) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Promedia los vértices para ubicar una etiqueta dentro de la figura. */
function centroid(points) {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/**
 * Polígonos interactivos superpuestos sobre una imagen.
 *
 * Las coordenadas son porcentajes de la caja de la imagen, por lo que las figuras
 * permanecen alineadas a cualquier tamaño. El SVG se estira con
 * `preserveAspectRatio="none"` y deformaría el texto; las etiquetas se ubican
 * como HTML en vez de dibujarse dentro del SVG.
 */
/**
 * `restingFill` define la intensidad de una zona inactiva. Las zonas separadas
 * (unidades de un plano) pueden tener un tinte fuerte para comunicar su estado.
 * Las zonas que cubren toda una imagen (pisos sobre una fachada) necesitan uno
 * tenue para no ocultarla.
 */
export default function HotspotOverlay({
  shapes,
  activeId,
  onSelect,
  labelled = true,
  interactive = true,
  restingFill = 0.4,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="absolute inset-0" style={{ pointerEvents: interactive ? "auto" : "none" }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {shapes.map((shape) => {
          const style = statusStyle(shape.status);
          const highlighted = shape.id === hoveredId || shape.id === activeId;
          return (
            <polygon
              key={shape.id}
              points={toPoints(shape.points)}
              role="button"
              tabIndex={0}
              aria-label={shape.label}
              onPointerEnter={() => setHoveredId(shape.id)}
              onPointerLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(shape.id)}
              onBlur={() => setHoveredId(null)}
              onClick={() => onSelect?.(shape)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(shape);
                }
              }}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer outline-none transition-[fill-opacity,stroke-opacity,stroke-width] duration-150"
              style={{
                // Las figuras inactivas ya muestran el color de su estado para
                // comunicarlo sin tener que recorrer cada zona con el cursor.
                fill: style.fill,
                fillOpacity: highlighted ? 1 : restingFill,
                stroke: style.color,
                strokeOpacity: highlighted ? 1 : 0.55,
                strokeWidth: highlighted ? 2.5 : 1.5,
              }}
            />
          );
        })}
      </svg>

      {/* Solo la zona resaltada muestra etiqueta; mostrarlas todas a la vez
          ocultaría la imagen bajo el texto. */}
      {labelled &&
        shapes
          .filter((shape) => shape.id === hoveredId || shape.id === activeId)
          .map((shape) => {
            const [cx, cy] = centroid(shape.points);
            const style = statusStyle(shape.status);
            return (
              <span
                key={shape.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium"
                style={{ left: `${cx}%`, top: `${cy}%`, background: style.color, color: "#04241A" }}
              >
                {shape.label}
              </span>
            );
          })}
    </div>
  );
}
