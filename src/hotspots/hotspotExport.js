const DECIMALS = 2;

/** Redondea coordenadas porcentuales para mantener legible el JSON exportado. */
function roundPoints(points) {
  return points.map(([x, y]) => [Number(x.toFixed(DECIMALS)), Number(y.toFixed(DECIMALS))]);
}

/**
 * Construye el fragmento JSON que se pegará en `building.json`.
 *
 * `units` genera entradas para el arreglo `units` de un piso; `floors` genera el
 * `hotspot` de cada piso sobre el render del edificio.
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

/** Serializa la exportación con el formato compacto de coordenadas del repositorio. */
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
