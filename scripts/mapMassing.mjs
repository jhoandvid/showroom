/**
 * Geometry of the project volume drawn on the site map.
 *
 * The map is a top-down raster, so the volume is a footprint quad extruded
 * straight up the screen. Both the SVG markup and the clickable silhouette come
 * from here, which is what keeps them aligned.
 *
 * Coordinates are percentages of the composed map frame.
 */

export const MAP_FRAME = { w: 1024, h: 680 };

/**
 * Footprint on the block, ordered back-left, back-right, front-right, front-left.
 * Slightly rotated to follow the street grid at this location.
 */
export const FOOTPRINT = [
  [46.4, 51.4],
  [54.0, 52.4],
  [53.2, 58.9],
  [45.6, 57.9],
];

/** Extrusion height, in percent of the frame height. */
export const HEIGHT = 17;

const ACCENT = "#1FAE72";

const toPx = ([x, y]) => [(x / 100) * MAP_FRAME.w, (y / 100) * MAP_FRAME.h];
const raise = ([x, y], dy) => [x, y - dy];
const points = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Base and roof rings in pixel space. */
function rings() {
  const base = FOOTPRINT.map(toPx);
  const dy = (HEIGHT / 100) * MAP_FRAME.h;
  return { base, roof: base.map((p) => raise(p, dy)), dy };
}

/**
 * Outline of the extruded volume.
 *
 * Walking the union boundary: the roof supplies the top and both upper flanks,
 * the base supplies the bottom edge.
 */
export function silhouette() {
  const { base, roof } = rings();
  const ring = [roof[0], roof[1], roof[2], base[2], base[3], roof[3]];
  return ring.map(([x, y]) => [
    Number(((x / MAP_FRAME.w) * 100).toFixed(2)),
    Number(((y / MAP_FRAME.h) * 100).toFixed(2)),
  ]);
}

/** SVG markup for the volume: walls, storey lines, roof, shadow and label. */
export function massingSvg(name, levels) {
  const { base, roof, dy } = rings();

  // Ground shadow, offset slightly to suggest a light source.
  const shadow = points(base.map(([x, y]) => [x + 9, y + 5]));

  const wall = (i, j, fill) =>
    `<polygon points="${points([roof[i], roof[j], base[j], base[i]])}" fill="${fill}" stroke="${ACCENT}" stroke-width="1.2" stroke-opacity="0.5"/>`;

  const storeys = Array.from({ length: levels - 1 }, (_, k) => {
    const lift = (dy * (k + 1)) / levels;
    const a = raise(base[3], lift);
    const b = raise(base[2], lift);
    const c = raise(base[1], lift);
    return `<polyline points="${points([a, b, c])}" fill="none" stroke="#0F3A2C" stroke-width="1" stroke-opacity="0.5"/>`;
  }).join("");

  const [lx, ly] = roof.reduce(
    (acc, [x, y]) => [acc[0] + x / roof.length, Math.min(acc[1], y)],
    [0, Infinity],
  );

  return `
  <polygon points="${shadow}" fill="#000" opacity="0.45"/>
  ${wall(3, 2, "#3E6B5F")}
  ${wall(0, 3, "#31564D")}
  ${wall(1, 2, "#4A7D6E")}
  ${storeys}
  <polygon points="${points(roof)}" fill="#8FBDB0" stroke="${ACCENT}" stroke-width="1.6"/>
  <g>
    <rect x="${(lx - 96).toFixed(1)}" y="${(ly - 46).toFixed(1)}" width="192" height="30" rx="15" fill="#04241A" stroke="${ACCENT}" stroke-width="1.2"/>
    <text x="${lx.toFixed(1)}" y="${(ly - 25).toFixed(1)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">${name}</text>
  </g>`;
}
