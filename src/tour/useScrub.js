import { useCallback, useEffect, useRef, useState } from "react";

const MIN_PX_PER_FRAME = 1.5;
const WHEEL_DIVISOR = 40;

function clamp(value, max) {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/**
 * Own the current frame index and drive it from pointer, wheel and key input.
 *
 * Dragging right-to-left advances the walkthrough; one full-width drag covers
 * the whole tour, so sensitivity scales with the container width.
 */
export function useScrub({ total, containerRef, onInteract }) {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const indexRef = useRef(0);
  const dragRef = useRef({ startX: 0, startIndex: 0, pxPerFrame: 4 });
  const maxIndex = total - 1;

  const seek = useCallback(
    (next) => {
      const value = clamp(Math.round(next), maxIndex);
      indexRef.current = value;
      setIndex(value);
    },
    [maxIndex],
  );

  const step = useCallback((delta) => seek(indexRef.current + delta), [seek]);

  const onPointerDown = useCallback(
    (event) => {
      const element = containerRef.current;
      if (!element || event.button !== 0) return;
      const { width } = element.getBoundingClientRect();
      dragRef.current = {
        startX: event.clientX,
        startIndex: indexRef.current,
        pxPerFrame: Math.max(width / total, MIN_PX_PER_FRAME),
      };
      setIsDragging(true);
      onInteract?.();
    },
    [containerRef, total, onInteract],
  );

  useEffect(() => {
    if (!isDragging) return undefined;
    const onMove = (event) => {
      const { startX, startIndex, pxPerFrame } = dragRef.current;
      seek(startIndex + (startX - event.clientX) / pxPerFrame);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging, seek]);

  const onWheel = useCallback(
    (event) => {
      if (Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      step(event.deltaY / WHEEL_DIVISOR);
      onInteract?.();
    },
    [step, onInteract],
  );

  const onKeyDown = useCallback(
    (event) => {
      const moves = { ArrowRight: 1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
      if (event.key in moves) {
        event.preventDefault();
        step(moves[event.key]);
      } else if (event.key === "Home") {
        seek(0);
      } else if (event.key === "End") {
        seek(maxIndex);
      } else {
        return;
      }
      onInteract?.();
    },
    [step, seek, maxIndex, onInteract],
  );

  return { index, seek, step, isDragging, handlers: { onPointerDown, onWheel, onKeyDown } };
}
