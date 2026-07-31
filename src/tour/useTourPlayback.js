import { useCallback, useEffect, useRef, useState } from "react";
import { frameToTime, timeToFrame } from "./tourConfig";

/**
 * Controla la capa mp4 usada para reproducir el recorrido de forma continua.
 *
 * La secuencia de imágenes permite desplazamiento inmediato, pero solo muestrea
 * el render a 5 fps; por eso la reproducción continua utiliza el video.
 */
export function useTourPlayback({ videoRef, seek }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef(0);

  const stop = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused) video.pause();
    setIsPlaying(false);
  }, [videoRef]);

  const start = useCallback(
    async (fromIndex) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = frameToTime(fromIndex);
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    },
    [videoRef],
  );

  // Refleja la posición de reproducción en el índice de cuadro para que la capa
  // de imágenes, la barra y los capítulos estén sincronizados al detenerse.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const tick = () => {
      const video = videoRef.current;
      if (video) seek(timeToFrame(video.currentTime));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, seek, videoRef]);

  return { isPlaying, start, stop };
}
