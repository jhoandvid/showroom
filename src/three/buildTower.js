import * as THREE from "three";
import { statusStyle } from "../theme";

const WIDTH = 38;
const DEPTH = 30;
const SLAB = 0.38;
const GLASS_INSET = 0.7;

/** Estado comercial dominante: disponible si alguna unidad todavía lo está. */
export function floorStatus(floor) {
  if (floor.units.some((unit) => unit.status === "disponible")) return "disponible";
  if (floor.units.some((unit) => unit.status === "reservado")) return "reservado";
  return "vendido";
}

/** Vidriado de un piso, teñido según cuánto queda disponible para la venta. */
function glassMaterial(status) {
  const tint = new THREE.Color(statusStyle(status).color).lerp(new THREE.Color("#9FC6C4"), 0.62);
  return new THREE.MeshStandardMaterial({
    color: tint,
    metalness: 0.55,
    roughness: 0.16,
    transparent: true,
    opacity: 0.9,
  });
}

const slabMaterial = () =>
  new THREE.MeshStandardMaterial({ color: "#DCE2E0", metalness: 0.1, roughness: 0.7 });

/** Núcleo de circulación vertical que sobresale de la cubierta. */
function addCore(group, totalHeight) {
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * 0.2, totalHeight + 3.4, DEPTH * 0.26),
    new THREE.MeshStandardMaterial({ color: "#B9C2C0", metalness: 0.15, roughness: 0.65 }),
  );
  core.position.set(WIDTH * 0.12, (totalHeight + 3.4) / 2, -DEPTH * 0.1);
  core.castShadow = true;
  group.add(core);
}

/**
 * Construye la torre con una malla seleccionable por piso.
 *
 * Las mallas incluyen `userData.floor` para vincular directamente el resultado
 * del raycast con los datos y reemplazar por completo los hotspots 2D.
 */
export function buildTower(floors, { levelBase, levelHeight }) {
  const group = new THREE.Group();
  const pickable = [];
  let totalHeight = 0;

  floors.forEach((floor) => {
    const height = levelHeight(floor.level);
    const base = levelBase(floor.level);
    totalHeight = Math.max(totalHeight, base + height);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(WIDTH - GLASS_INSET, height - SLAB, DEPTH - GLASS_INSET),
      glassMaterial(floorStatus(floor)),
    );
    glass.position.y = base + (height - SLAB) / 2;
    glass.castShadow = true;
    glass.receiveShadow = true;
    glass.userData.floor = floor;
    group.add(glass);
    pickable.push(glass);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, SLAB, DEPTH), slabMaterial());
    slab.position.y = base + height - SLAB / 2;
    slab.castShadow = true;
    group.add(slab);
  });

  // Losa de base y parapeto de cubierta.
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 6, 0.6, DEPTH + 6),
    slabMaterial(),
  );
  plinth.position.y = 0.3;
  plinth.receiveShadow = true;
  group.add(plinth);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(WIDTH + 1.4, 1.1, DEPTH + 1.4), slabMaterial());
  parapet.position.y = totalHeight + 0.55;
  parapet.castShadow = true;
  group.add(parapet);

  addCore(group, totalHeight);

  return { group, pickable, totalHeight, footprint: { width: WIDTH, depth: DEPTH } };
}

/** Libera todas las geometrías y materiales pertenecientes a la torre. */
export function disposeTower(group) {
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}
