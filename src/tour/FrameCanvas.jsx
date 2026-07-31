import { useEffect, useRef } from "react";
import { resolveFrame } from "./useFrameSequence";

/**
 * Paint the still for `index` onto a fixed-size canvas.
 *
 * The canvas keeps the frame's intrinsic resolution and relies on CSS
 * `object-fit: cover` for layout, so no manual crop maths is needed.
 * `revision` exists to force a repaint as late-arriving frames replace
 * the nearest-neighbour fallback.
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
