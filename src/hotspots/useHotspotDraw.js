import { useCallback, useRef, useState } from "react";

const MIN_POINTS = 3;

/**
 * Author polygon hotspots by clicking on an image.
 *
 * Points are stored as percentages of the image box so the exported shapes are
 * resolution independent.
 */
export function useHotspotDraw() {
  const [shapes, setShapes] = useState([]);
  const [draft, setDraft] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const nextId = useRef(1);

  const addPoint = useCallback((point) => {
    setDraft((prev) => [...prev, point]);
  }, []);

  const undoPoint = useCallback(() => {
    setDraft((prev) => prev.slice(0, -1));
  }, []);

  const cancelDraft = useCallback(() => setDraft([]), []);

  /** Turn the draft into a shape once it has enough points to be a polygon. */
  const commitDraft = useCallback(() => {
    if (draft.length < MIN_POINTS) return;
    const id = `h${nextId.current}`;
    nextId.current += 1;
    setShapes((prev) => [...prev, { id, label: "", status: "disponible", points: draft }]);
    setSelectedId(id);
    setDraft([]);
  }, [draft]);

  const updateShape = useCallback((id, patch) => {
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)));
  }, []);

  const removeShape = useCallback((id) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const clearAll = useCallback(() => {
    setShapes([]);
    setDraft([]);
    setSelectedId(null);
    nextId.current = 1;
  }, []);

  /** Replace the whole set, used when loading shapes back in to edit them. */
  const loadShapes = useCallback((incoming) => {
    setShapes(incoming);
    setDraft([]);
    setSelectedId(null);
    nextId.current = incoming.length + 1;
  }, []);

  return {
    shapes,
    draft,
    selectedId,
    setSelectedId,
    addPoint,
    undoPoint,
    cancelDraft,
    commitDraft,
    updateShape,
    removeShape,
    clearAll,
    loadShapes,
    canCommit: draft.length >= MIN_POINTS,
  };
}
