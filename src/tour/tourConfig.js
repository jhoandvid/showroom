import manifest from "./tourManifest.json";

/**
 * Estructura de assets del recorrido, capítulos y metadatos del proyecto.
 *
 * Los assets de `public/tour/` se generan con `scripts/build-tour.sh`, que también
 * reescribe `tourManifest.json` para sincronizar cantidad de cuadros y duración:
 *   frames/  -> imágenes webp muestreadas del render para el arrastre
 *   tour.mp4 -> recodificación H.264 para reproducción continua
 */
export const TOUR = {
  frameCount: manifest.frameCount,
  // ffmpeg numera su salida desde 1; el número de archivo es el índice más uno.
  frameUrl: (index) => `/tour/frames/f${String(index + 1).padStart(3, "0")}.webp`,
  videoUrl: "/tour/tour.mp4",
  posterUrl: "/tour/poster.webp",
  frameWidth: manifest.frameWidth,
  frameHeight: manifest.frameHeight,
  durationSeconds: manifest.durationSeconds,
};

/** Convierte un índice de cuadro a su instante en el video. */
export function frameToTime(index) {
  return (index / (TOUR.frameCount - 1)) * TOUR.durationSeconds;
}

/** Convierte un instante del video al índice de cuadro más cercano. */
export function timeToFrame(seconds) {
  return Math.round((seconds / TOUR.durationSeconds) * (TOUR.frameCount - 1));
}

/** Paradas nombradas del recorrido, ordenadas según su posición. */
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

/** Devuelve el índice del último capítulo alcanzado por el cabezal. */
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
