import manifest from "./tourManifest.json";

/**
 * Tour asset layout, chapter map and project metadata.
 *
 * Assets under `public/tour/` are produced by `scripts/build-tour.sh`, which
 * also rewrites `tourManifest.json` so frame count and duration never drift
 * from what is actually on disk:
 *   frames/  -> webp stills sampled from the render, used for the drag scrub
 *   tour.mp4 -> H.264 re-encode used for smooth linear playback
 */
export const TOUR = {
  frameCount: manifest.frameCount,
  // ffmpeg numbers its output from 1, so the file number is the index plus one.
  frameUrl: (index) => `/tour/frames/f${String(index + 1).padStart(3, "0")}.webp`,
  videoUrl: "/tour/tour.mp4",
  posterUrl: "/tour/poster.webp",
  frameWidth: manifest.frameWidth,
  frameHeight: manifest.frameHeight,
  durationSeconds: manifest.durationSeconds,
};

/** Convert a frame index to its timestamp in the playback video. */
export function frameToTime(index) {
  return (index / (TOUR.frameCount - 1)) * TOUR.durationSeconds;
}

/** Convert a playback timestamp back to the nearest frame index. */
export function timeToFrame(seconds) {
  return Math.round((seconds / TOUR.durationSeconds) * (TOUR.frameCount - 1));
}

/** Named stops along the walkthrough, ordered by position in the tour. */
export const CHAPTERS = [
  { code: "01", label: "Acceso", desc: "Puerta principal, apto. 123", frame: 0 },
  { code: "02", label: "Cocina", desc: "Barra y ventanal a la ciudad", frame: 40 },
  { code: "03", label: "Sala", desc: "Área social, doble altura", frame: 50 },
  { code: "04", label: "Comedor", desc: "Comedor y escalera de caracol", frame: 65 },
  { code: "05", label: "Segundo nivel", desc: "Distribución de alcobas", frame: 113 },
  { code: "06", label: "Alcoba principal", desc: "Panel ranurado y nochero", frame: 125 },
  { code: "07", label: "Alcoba con balcón", desc: "Clóset y salida a balcón", frame: 163 },
  { code: "08", label: "Baño", desc: "Ducha y mobiliario", frame: 187 },
];

/** Return the index of the last chapter already reached by the playhead. */
export function activeChapterIndex(chapters, frame) {
  let active = 0;
  chapters.forEach((chapter, i) => {
    if (chapter.frame <= frame) active = i;
  });
  return active;
}

export const PROJECT = {
  name: "Bosques del Norte",
  tagline: "Showroom virtual",
  location: "Bogotá, Colombia",
  unit: "Apartamento dúplex · 123",
  whatsappPhone: "573001234567",
};
