import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Maximize, Minimize, Pause, Play } from "lucide-react";
import { activeChapterIndex, CHAPTERS, TOUR } from "./tour/tourConfig";
import { useFrameSequence } from "./tour/useFrameSequence";
import { useScrub } from "./tour/useScrub";
import { useTourPlayback } from "./tour/useTourPlayback";
import FrameCanvas from "./tour/FrameCanvas";
import TourChapters from "./tour/TourChapters";
import TourHeader from "./tour/TourHeader";
import TourProgress from "./tour/TourProgress";
import { ACCENT, SURFACE } from "./theme";

const CONTROL_STYLE = { background: "rgba(255,255,255,0.13)" };

/** `project` overrides the default identity so a unit page can name the unit. */
export default function ShowroomViewer({ project }) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const sequence = useFrameSequence(TOUR);
  const markInteracted = useCallback(() => setHasInteracted(true), []);
  const { index, seek, isDragging, handlers } = useScrub({
    total: TOUR.frameCount,
    containerRef: stageRef,
    onInteract: markInteracted,
  });
  const playback = useTourPlayback({ videoRef, seek });

  // Any manual scrub takes over from playback.
  const onStagePointerDown = useCallback(
    (event) => {
      playback.stop();
      handlers.onPointerDown(event);
    },
    [playback, handlers],
  );

  const togglePlay = useCallback(() => {
    setHasInteracted(true);
    if (playback.isPlaying) {
      playback.stop();
      return;
    }
    playback.start(index >= TOUR.frameCount - 1 ? 0 : index);
  }, [playback, index]);

  const jumpTo = useCallback(
    (frame) => {
      setHasInteracted(true);
      playback.stop();
      seek(frame);
    },
    [playback, seek],
  );

  // React attaches wheel listeners passively, so bind it directly to opt out.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = handlers.onWheel;
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [handlers.onWheel]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else stageRef.current?.requestFullscreen?.();
  };

  const chapterIndex = useMemo(() => activeChapterIndex(CHAPTERS, index), [index]);
  const chapter = CHAPTERS[chapterIndex];
  const loadPercent = Math.min(
    100,
    Math.round((sequence.loaded / sequence.coarseTotal) * 100),
  );

  return (
    <div className="w-full">
      <div
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-label={`Recorrido virtual — ${chapter.label}`}
        onPointerDown={onStagePointerDown}
        onKeyDown={handlers.onKeyDown}
        className="relative w-full touch-none select-none overflow-hidden outline-none"
        style={{
          // In fullscreen the stage owns the whole screen, so a fixed ratio
          // would overflow on displays that are not 16:9.
          aspectRatio: isFullscreen ? "auto" : "16 / 9",
          height: isFullscreen ? "100%" : undefined,
          background: SURFACE,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <FrameCanvas
          framesRef={sequence.framesRef}
          index={index}
          width={TOUR.frameWidth}
          height={TOUR.frameHeight}
          revision={sequence.loaded}
          objectFit={isFullscreen ? "contain" : "cover"}
        />

        <video
          ref={videoRef}
          src={TOUR.videoUrl}
          poster={TOUR.posterUrl}
          preload="metadata"
          muted
          playsInline
          onEnded={playback.stop}
          className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-150"
          style={{
            opacity: playback.isPlaying ? 1 : 0,
            objectFit: isFullscreen ? "contain" : "cover",
          }}
        />

        {!sequence.ready && !sequence.failed && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "rgba(11,13,14,0.92)" }}
          >
            <div
              className="h-9 w-9 animate-spin rounded-full"
              style={{ border: "2px solid rgba(255,255,255,0.15)", borderTopColor: ACCENT }}
            />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              Preparando el recorrido · {loadPercent}%
            </p>
          </div>
        )}

        {sequence.failed && (
          <div
            className="absolute inset-0 flex items-center justify-center px-8"
            style={{ background: "rgba(0,0,0,0.8)" }}
          >
            <div className="flex max-w-sm items-start gap-3 rounded-xl p-4" style={CONTROL_STYLE}>
              <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: "#F0997B" }} />
              <p className="text-xs leading-relaxed text-white">
                No se pudieron cargar los frames del recorrido. Verificá que la carpeta
                <code className="mx-1">public/tour/frames</code> esté publicada.
              </p>
            </div>
          </div>
        )}

        {sequence.ready && !hasInteracted && !playback.isPlaying && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <span
              className="rounded-full px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              ↔ Arrastrá para recorrer el apartamento
            </span>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
        />
        <TourHeader chapterLabel={chapter.label} project={project} />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}
        />
        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-2">
          <TourProgress
            index={index}
            total={TOUR.frameCount}
            chapters={CHAPTERS}
            onSeek={jumpTo}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={togglePlay}
              aria-label={playback.isPlaying ? "Pausar recorrido" : "Reproducir recorrido"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={CONTROL_STYLE}
            >
              {playback.isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <div className="ml-1 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{chapter.label}</p>
              <p className="truncate text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                {chapter.desc}
              </p>
            </div>

            {sequence.ready && sequence.loaded < sequence.total && (
              <span className="shrink-0 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                cargando detalle…
              </span>
            )}

            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={CONTROL_STYLE}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>

          <TourChapters
            chapters={CHAPTERS}
            activeIndex={chapterIndex}
            onSelect={jumpTo}
          />
        </div>
      </div>
    </div>
  );
}
