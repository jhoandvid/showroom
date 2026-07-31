import { useCallback, useRef, useState } from "react";

const MIN_POINTS = 3;

/**
 * Permite crear hotspots poligonales haciendo clic sobre una imagen.
 *
 * Los puntos se guardan como porcentajes de la caja de la imagen para que las
 * figuras exportadas sean independientes de la resolución.
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

  /** Convierte el borrador en una figura cuando tiene suficientes puntos. */
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

  /** Reemplaza el conjunto completo al volver a cargar figuras para editarlas. */
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
