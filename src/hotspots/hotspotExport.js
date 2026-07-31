const DECIMALS = 2;

/** Round percentage coordinates so the exported JSON stays readable. */
function roundPoints(points) {
  return points.map(([x, y]) => [Number(x.toFixed(DECIMALS)), Number(y.toFixed(DECIMALS))]);
}

/**
 * Build the JSON snippet to paste into `building.json`.
 *
 * `units` produces entries for a floor's `units` array; `floors` produces the
 * `hotspot` of each floor on the building render.
 */
export function buildExport(shapes, mode) {
  if (mode === "floors") {
    return shapes.map((shape) => ({
      id: Number(shape.label) || shape.label,
      hotspot: roundPoints(shape.points),
    }));
  }
  return shapes.map((shape) => ({
    code: shape.label,
    status: shape.status,
    hotspot: roundPoints(shape.points),
  }));
}

/** Serialise the export with the compact coordinate layout used in the repo. */
export function serializeExport(shapes, mode) {
  const rows = buildExport(shapes, mode).map((entry) => {
    const { hotspot, ...rest } = entry;
    const coords = hotspot.map(([x, y]) => `[${x}, ${y}]`).join(", ");
    const head = Object.entries(rest)
      .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
      .join(", ");
    return `  { ${head}, "hotspot": [${coords}] }`;
  });
  return `[\n${rows.join(",\n")}\n]`;
}
