import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Renderer tuned for a dark architectural scene. */
export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

/** Sun light sized to cast a usable shadow over the given extent. */
function createSun(extent) {
  const sun = new THREE.DirectionalLight("#FFF6E8", 2.4);
  sun.position.set(extent * 1.1, extent * 1.7, extent * 0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const reach = extent * 1.8;
  Object.assign(sun.shadow.camera, {
    left: -reach,
    right: reach,
    top: reach,
    bottom: -reach,
    near: 1,
    far: extent * 6,
  });
  sun.shadow.bias = -0.0008;
  return sun;
}

/** Dark ground disc with a faint ring, so the model has somewhere to sit. */
function createGround(extent) {
  const group = new THREE.Group();

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(extent * 3.2, 96),
    new THREE.MeshStandardMaterial({ color: "#161C1E", metalness: 0.05, roughness: 0.95 }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  group.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(extent * 1.5, extent * 1.53, 96),
    new THREE.MeshBasicMaterial({ color: "#2C3A3B", transparent: true, opacity: 0.7 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  return group;
}

/**
 * Assemble the scene around a model of the given extent.
 *
 * Lighting comes from `RoomEnvironment`, which ships with three, so the glass
 * gets believable reflections without downloading an HDRI.
 */
export function createScene(renderer, extent) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0D1113");
  scene.fog = new THREE.Fog("#0D1113", extent * 3, extent * 7);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight("#9FB4C0", "#171E20", 0.85));
  scene.add(createSun(extent));
  scene.add(createGround(extent));

  return { scene, environment, pmrem };
}

/** Keep the drawing buffer and camera in step with the element size. */
export function resizeToHolder(renderer, camera, holder) {
  const { clientWidth, clientHeight } = holder;
  if (!clientWidth || !clientHeight) return;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}
