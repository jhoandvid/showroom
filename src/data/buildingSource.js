import building from "./building.json";

/**
 * Punto único de acceso a los datos del edificio.
 *
 * Todo se lee desde el JSON incluido. Cuando el estado comercial pase al
 * servicio FastAPI, solo deberá cambiar este módulo: las vistas nunca acceden
 * directamente al JSON.
 */

/** Devuelve el documento del edificio. */
export function getBuilding() {
  return building;
}

/** Devuelve el piso con el id indicado o null si no existe. */
export function getFloor(floorId) {
  const id = Number(floorId);
  return building.floors.find((floor) => floor.id === id) ?? null;
}

/** Devuelve el piso más alto, usado como selección predeterminada. */
export function getDefaultFloor() {
  return building.floors[0] ?? null;
}

/** Busca una unidad por código y la devuelve junto con su piso. */
export function findUnit(unitCode) {
  for (const floor of building.floors) {
    const unit = floor.units.find((candidate) => candidate.code === String(unitCode));
    if (unit) return { unit, floor };
  }
  return null;
}

/** Altura construida total en metros, utilizada por las vistas 3D. */
export function getBuildingHeight() {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return groundFloorMeters + (building.floors.length - 1) * floorHeightMeters;
}

/** Altura de la losa bajo un nivel, en metros sobre la rasante. */
export function levelBase(level) {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return level <= 1 ? 0 : groundFloorMeters + (level - 2) * floorHeightMeters;
}

/** Altura de un nivel individual, en metros. */
export function levelHeight(level) {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return level === 1 ? groundFloorMeters : floorHeightMeters;
}

/** Cuenta las unidades por estado comercial. */
export function countByStatus(units) {
  return units.reduce((totals, unit) => {
    totals[unit.status] = (totals[unit.status] ?? 0) + 1;
    return totals;
  }, {});
}

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: building.currency,
  maximumFractionDigits: 0,
});

/** Formatea el precio de una unidad en la moneda del edificio. */
export function formatPrice(value) {
  return priceFormatter.format(value);
}

/** Formatea un área con el sufijo de unidad. */
export function formatArea(value) {
  return `${value.toFixed(1).replace(".", ",")} m²`;
}
