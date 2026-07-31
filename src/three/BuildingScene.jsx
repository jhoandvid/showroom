import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw, RotateCw } from "lucide-react";
import { buildTower, disposeTower, floorStatus } from "./buildTower";
import { createRenderer, createScene, resizeToHolder } from "./scene";
import { statusStyle } from "../theme";

const HOVER_EMISSIVE = new THREE.Color("#1FAE72");

/** Frame the tower from a three-quarter view. */
function placeCamera(camera, controls, totalHeight, extent) {
  camera.position.set(extent * 1.5, totalHeight * 1.15, extent * 1.75);
  controls.target.set(0, totalHeight * 0.45, 0);
  controls.update();
}

/**
 * The building as a real 3D model you can orbit, with each floor pickable.
 *
 * Hovering highlights a floor and clicking opens it. Because selection is a
 * raycast against the actual geometry, there are no 2D hotspot coordinates to
 * keep in sync with the image.
 */
export default function BuildingScene({ floors, levelBase, levelHeight, onSelectFloor }) {
  const holderRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({});
  const onSelectRef = useRef(onSelectFloor);
  const [hovered, setHovered] = useState(null);
  const [spinning, setSpinning] = useState(false);

  onSelectRef.current = onSelectFloor;

  useEffect(() => {
    const holder = holderRef.current;
    const canvas = canvasRef.current;
    if (!holder || !canvas) return undefined;

    const renderer = createRenderer(canvas);
    const tower = buildTower(floors, { levelBase, levelHeight });
    const extent = Math.max(tower.footprint.width, tower.footprint.depth);
    const { scene, environment, pmrem } = createScene(renderer, extent);
    scene.add(tower.group);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.5, extent * 12);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = extent * 0.9;
    controls.maxDistance = extent * 4.5;
    // Stop the camera dropping under the ground plane.
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.autoRotateSpeed = 0.7;
    placeCamera(camera, controls, tower.totalHeight, extent);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerInside = false;
    let hoveredMesh = null;

    const applyHover = (mesh) => {
      if (hoveredMesh === mesh) return;
      if (hoveredMesh) {
        hoveredMesh.material.emissive.setHex(0x000000);
        hoveredMesh.material.emissiveIntensity = 0;
      }
      hoveredMesh = mesh;
      if (mesh) {
        mesh.material.emissive.copy(HOVER_EMISSIVE);
        mesh.material.emissiveIntensity = 0.5;
      }
      setHovered(mesh?.userData.floor ?? null);
      canvas.style.cursor = mesh ? "pointer" : "grab";
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      applyHover(null);
    };
    const onClick = () => {
      if (hoveredMesh) onSelectRef.current?.(hoveredMesh.userData.floor.id);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onClick);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      controls.update();
      if (pointerInside && !controls.autoRotate) {
        raycaster.setFromCamera(pointer, camera);
        applyHover(raycaster.intersectObjects(tower.pickable, false)[0]?.object ?? null);
      }
      renderer.render(scene, camera);
    };

    resizeToHolder(renderer, camera, holder);
    tick();

    const observer = new ResizeObserver(() => resizeToHolder(renderer, camera, holder));
    observer.observe(holder);

    stateRef.current = { controls, camera, totalHeight: tower.totalHeight, extent };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      controls.dispose();
      disposeTower(tower.group);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      stateRef.current = {};
    };
  }, [floors, levelBase, levelHeight]);

  const toggleSpin = useCallback(() => {
    const { controls } = stateRef.current;
    if (!controls) return;
    controls.autoRotate = !controls.autoRotate;
    setSpinning(controls.autoRotate);
  }, []);

  const resetView = useCallback(() => {
    const { controls, camera, totalHeight, extent } = stateRef.current;
    if (!controls) return;
    controls.autoRotate = false;
    setSpinning(false);
    placeCamera(camera, controls, totalHeight, extent);
  }, []);

  const hoveredStyle = hovered ? statusStyle(floorStatus(hovered)) : null;

  return (
    <div
      ref={holderRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        height: "clamp(400px, 60vh, 680px)",
        background: "#0D1113",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={{ cursor: "grab" }} />

      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
        <span
          className="rounded-full px-3 py-1.5 text-[11px] backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)" }}
        >
          Arrastrá para girar · rueda para acercar
        </span>

        {hovered && (
          <span
            className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: hoveredStyle.color, color: "#04241A" }}
          >
            {hovered.label} · {hovered.units.filter((u) => u.status === "disponible").length} de{" "}
            {hovered.units.length} libres
          </span>
        )}
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          type="button"
          onClick={toggleSpin}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm"
          style={{
            background: spinning ? "rgba(31,174,114,0.9)" : "rgba(0,0,0,0.55)",
            color: spinning ? "#04241A" : "#fff",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <RotateCw size={12} />
          {spinning ? "Detener giro" : "Girar solo"}
        </button>
        <button
          type="button"
          onClick={resetView}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <RotateCcw size={12} />
          Vista inicial
        </button>
      </div>
    </div>
  );
}
