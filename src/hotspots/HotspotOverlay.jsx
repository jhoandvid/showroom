import { useState } from "react";
import { statusStyle } from "../theme";

/** Serialise percentage points into the SVG `points` attribute. */
function toPoints(points) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Average the vertices — close enough to place a label inside the shape. */
function centroid(points) {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/**
 * Interactive polygons layered over an image.
 *
 * Coordinates are percentages of the image box, so a shape stays aligned at any
 * size. The SVG stretches with `preserveAspectRatio="none"`, which would distort
 * text, so labels are positioned as HTML instead of drawn inside the SVG.
 */
/**
 * `restingFill` is how strongly an untouched zone is tinted. Zones separated by
 * gaps (units on a plan) can carry a strong tint and read as status at a glance.
 * Zones that tile a whole image (floor bands over a facade) need a faint one, or
 * the tint becomes the image.
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
                // Resting shapes already carry their status colour so the
                // commercial state reads without hovering every zone.
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

      {/* Only the highlighted zone gets a label: showing all of them at once
          buries the image under text. */}
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
