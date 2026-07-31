import building from "./building.json";

/**
 * Single access point for building data.
 *
 * Everything is read from the bundled JSON. When the commercial state starts
 * living in the FastAPI service, only this module changes: the views never
 * touch the JSON directly.
 */

/** Return the building document. */
export function getBuilding() {
  return building;
}

/** Return the floor with the given id, or null when it does not exist. */
export function getFloor(floorId) {
  const id = Number(floorId);
  return building.floors.find((floor) => floor.id === id) ?? null;
}

/** Return the highest floor, used as the default selection. */
export function getDefaultFloor() {
  return building.floors[0] ?? null;
}

/** Locate a unit by code and return it together with its floor. */
export function findUnit(unitCode) {
  for (const floor of building.floors) {
    const unit = floor.units.find((candidate) => candidate.code === String(unitCode));
    if (unit) return { unit, floor };
  }
  return null;
}

/** Total built height in metres, used by the 3D views. */
export function getBuildingHeight() {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return groundFloorMeters + (building.floors.length - 1) * floorHeightMeters;
}

/** Height of the slab under a given level, in metres above grade. */
export function levelBase(level) {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return level <= 1 ? 0 : groundFloorMeters + (level - 2) * floorHeightMeters;
}

/** Height of a single level, in metres. */
export function levelHeight(level) {
  const { groundFloorMeters, floorHeightMeters } = building.site;
  return level === 1 ? groundFloorMeters : floorHeightMeters;
}

/** Count units per commercial state. */
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

/** Format a unit price in the building's currency. */
export function formatPrice(value) {
  return priceFormatter.format(value);
}

/** Format an area with the unit suffix. */
export function formatArea(value) {
  return `${value.toFixed(1).replace(".", ",")} m²`;
}
