import { useEffect, useRef, useState } from "react";

const CONCURRENCY = 6;
const COARSE_STEP = 8;

/** Carga una imagen y devuelve null en vez de rechazar si falla. */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Divide los índices de cuadros en una pasada inicial y otra de relleno.
 *
 * La pasada inicial se carga primero para volver interactivo el visor con una
 * fracción del peso; los cuadros faltantes usan el vecino más cercano.
 */
function buildPasses(frameCount) {
  const coarse = [];
  const fine = [];
  for (let i = 0; i < frameCount; i += 1) {
    if (i % COARSE_STEP === 0) coarse.push(i);
    else fine.push(i);
  }
  return { coarse, fine };
}

/** Carga los índices indicados con un número limitado de solicitudes paralelas. */
async function runPass(indices, frameUrl, onLoaded, isCancelled) {
  let cursor = 0;
  const worker = async () => {
    while (!isCancelled() && cursor < indices.length) {
      const index = indices[cursor];
      cursor += 1;
      const image = await loadImage(frameUrl(index));
      if (!isCancelled()) onLoaded(index, image);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

/** Devuelve el cuadro indicado o el vecino ya cargado más cercano. */
export function resolveFrame(frames, index) {
  if (frames[index]) return frames[index];
  for (let offset = 1; offset < frames.length; offset += 1) {
    if (frames[index - offset]) return frames[index - offset];
    if (frames[index + offset]) return frames[index + offset];
  }
  return null;
}

/**
 * Precarga progresivamente la secuencia de imágenes usada para el desplazamiento.
 *
 * Devuelve por referencia el arreglo mutable de cuadros (las imágenes no son
 * estado de React), junto con los contadores del indicador de carga.
 */
export function useFrameSequence({ frameCount, frameUrl }) {
  const framesRef = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    framesRef.current = new Array(frameCount).fill(null);
    setLoaded(0);
    setReady(false);
    setFailed(false);

    let done = 0;
    let errors = 0;
    const onLoaded = (index, image) => {
      framesRef.current[index] = image;
      done += 1;
      if (!image) errors += 1;
      setLoaded(done);
    };

    const { coarse, fine } = buildPasses(frameCount);
    (async () => {
      await runPass(coarse, frameUrl, onLoaded, isCancelled);
      if (cancelled) return;
      if (errors === coarse.length) {
        setFailed(true);
        return;
      }
      setReady(true);
      await runPass(fine, frameUrl, onLoaded, isCancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [frameCount, frameUrl]);

  return {
    framesRef,
    loaded,
    total: frameCount,
    // Cuadros de la pasada inicial necesarios para habilitar la interacción.
    coarseTotal: Math.ceil(frameCount / COARSE_STEP),
    ready,
    failed,
  };
}
