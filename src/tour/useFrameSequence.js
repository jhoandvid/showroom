import { useEffect, useRef, useState } from "react";

const CONCURRENCY = 6;
const COARSE_STEP = 8;

/** Load a single image, resolving to null instead of rejecting on failure. */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Split every frame index into a coarse pass and a fill-in pass.
 *
 * The coarse pass is loaded first so the viewer becomes interactive after a
 * fraction of the payload; missing frames fall back to the nearest neighbour.
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

/** Load the given indices with a bounded number of parallel requests. */
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

/** Return the frame at index, or the closest already-loaded neighbour. */
export function resolveFrame(frames, index) {
  if (frames[index]) return frames[index];
  for (let offset = 1; offset < frames.length; offset += 1) {
    if (frames[index - offset]) return frames[index - offset];
    if (frames[index + offset]) return frames[index + offset];
  }
  return null;
}

/**
 * Progressively preload the still sequence backing the scrub interaction.
 *
 * Returns the mutable frame array by ref (images are not React state), plus the
 * counters the UI needs for its loading indicator.
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
    // Frames the coarse pass has to finish before the viewer turns interactive.
    coarseTotal: Math.ceil(frameCount / COARSE_STEP),
    ready,
    failed,
  };
}
