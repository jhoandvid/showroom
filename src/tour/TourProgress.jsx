import { useCallback, useEffect, useRef, useState } from "react";
import { ACCENT } from "../theme";

/** Seekable progress track with a tick for every chapter. */
export default function TourProgress({ index, total, chapters, onSeek }) {
  const trackRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const maxIndex = total - 1;
  const percent = (index / maxIndex) * 100;

  const seekFromEvent = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track) return;
      const { left, width } = track.getBoundingClientRect();
      const ratio = (clientX - left) / width;
      onSeek(Math.min(Math.max(ratio, 0), 1) * maxIndex);
    },
    [onSeek, maxIndex],
  );

  useEffect(() => {
    if (!isScrubbing) return undefined;
    const onMove = (event) => seekFromEvent(event.clientX);
    const onUp = () => setIsScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isScrubbing, seekFromEvent]);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Posición en el recorrido"
      aria-valuemin={0}
      aria-valuemax={maxIndex}
      aria-valuenow={index}
      tabIndex={-1}
      onPointerDown={(event) => {
        event.stopPropagation();
        setIsScrubbing(true);
        seekFromEvent(event.clientX);
      }}
      className="relative h-6 cursor-pointer touch-none"
    >
      <div
        className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{ background: "rgba(255,255,255,0.16)" }}
      />
      <div
        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{ width: `${percent}%`, background: ACCENT }}
      />
      {chapters.map((chapter) => (
        <span
          key={chapter.code}
          title={chapter.label}
          className="absolute top-1/2 h-2 w-[2px] -translate-y-1/2 rounded-full"
          style={{
            left: `${(chapter.frame / maxIndex) * 100}%`,
            background: chapter.frame <= index ? ACCENT : "rgba(255,255,255,0.35)",
          }}
        />
      ))}
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${percent}%`, background: "#fff", boxShadow: "0 0 0 3px rgba(0,0,0,0.35)" }}
      />
    </div>
  );
}
