import { useEffect, useRef } from "react";
import { resolveFrame } from "./useFrameSequence";

/**
 * Dibuja la imagen de `index` en un canvas de tamaño fijo.
 *
 * El canvas conserva la resolución original y usa `object-fit: cover` para la
 * disposición, evitando cálculos manuales de recorte. `revision` fuerza un
 * repintado cuando llegan cuadros que reemplazan al vecino de respaldo.
 */
export default function FrameCanvas({ framesRef, index, width, height, revision, objectFit }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = resolveFrame(framesRef.current, index);
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }, [framesRef, index, revision]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 h-full w-full select-none"
      style={{ objectFit: objectFit ?? "cover" }}
    />
  );
}
