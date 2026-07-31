import { useCallback, useEffect, useRef, useState } from "react";
import { frameToTime, timeToFrame } from "./tourConfig";

/**
 * Drive the mp4 overlay used for smooth linear playback of the walkthrough.
 *
 * The still sequence gives a responsive scrub but only samples the render at
 * 5 fps, so continuous playback runs off the video instead.
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

  // Mirror playback position onto the frame index so the still layer, progress
  // bar and chapter list are already in sync the moment playback stops.
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
