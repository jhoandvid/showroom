import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, Trash2 } from "lucide-react";
import HotspotCanvas from "./HotspotCanvas";
import HotspotShapeList from "./HotspotShapeList";
import { serializeExport } from "./hotspotExport";
import { useHotspotDraw } from "./useHotspotDraw";
import { Link } from "../router/Link";
import { urls } from "../router/router";
import { ACCENT } from "../theme";

const MODES = [
  { key: "units", label: "Unidades", hint: "sobre una planta de piso" },
  { key: "floors", label: "Pisos", hint: "sobre el render del edificio" },
];

const PANEL_STYLE = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" };

/**
 * Herramienta de creación de hotspots poligonales usados por `building.json`.
 *
 * Permite cargar una imagen de referencia, marcar los vértices de cada zona,
 * nombrarla y copiar el JSON resultante. Las coordenadas son porcentuales, por
 * lo que las figuras funcionan con cualquier tamaño de render.
 */
export default function HotspotEditor() {
  const [mode, setMode] = useState("units");
  const [imageUrl, setImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const objectUrlRef = useRef("");
  const draw = useHotspotDraw();

  const pickImage = (file) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setImageUrl(objectUrlRef.current);
  };

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "Enter") draw.commitDraft();
      else if (event.key === "Escape") draw.cancelDraft();
      else if (event.key === "Backspace") {
        event.preventDefault();
        draw.undoPoint();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draw]);

  const exported = useMemo(() => serializeExport(draw.shapes, mode), [draw.shapes, mode]);

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const downloadExport = () => {
    const blob = new Blob([exported], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hotspots-${mode}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Herramienta interna
          </p>
          <h1 className="mt-1 text-xl font-medium text-white">Editor de hotspots</h1>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Clic para marcar vértices · <kbd>Enter</kbd> cierra la zona ·{" "}
            <kbd>Backspace</kbd> borra el último punto · <kbd>Esc</kbd> cancela
          </p>
        </div>
        <Link
          to={urls.building(166)}
          className="rounded-full px-4 py-2 text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
        >
          Volver al showroom
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {imageUrl ? (
            <HotspotCanvas
              imageUrl={imageUrl}
              shapes={draw.shapes}
              draft={draw.draft}
              selectedId={draw.selectedId}
              onAddPoint={draw.addPoint}
              onSelect={draw.setSelectedId}
            />
          ) : (
            <label
              className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl"
              style={{ border: `1px dashed ${ACCENT}66`, background: "rgba(255,255,255,0.02)" }}
            >
              <ImageIcon size={22} style={{ color: ACCENT }} />
              <span className="text-sm text-white">Cargá la imagen de referencia</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                el render del edificio, o la planta del piso
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => pickImage(event.target.files?.[0])}
              />
            </label>
          )}

          {draw.draft.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={draw.commitDraft}
                disabled={!draw.canCommit}
                className="rounded-full px-4 py-2 text-xs font-medium disabled:opacity-40"
                style={{ background: ACCENT, color: "#04241A" }}
              >
                Cerrar zona ({draw.draft.length} puntos)
              </button>
              <button
                type="button"
                onClick={draw.cancelDraft}
                className="rounded-full px-4 py-2 text-xs font-medium text-white"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl p-3" style={PANEL_STYLE}>
            <p className="mb-2 text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
              Qué estás marcando
            </p>
            <div className="flex gap-2">
              {MODES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMode(option.key)}
                  className="flex-1 rounded-lg px-2 py-2 text-xs"
                  style={{
                    background: mode === option.key ? `${ACCENT}26` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${mode === option.key ? ACCENT : "rgba(255,255,255,0.12)"}`,
                    color: mode === option.key ? "#fff" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {MODES.find((option) => option.key === mode)?.hint}
            </p>
          </div>

          <div className="rounded-xl p-3" style={PANEL_STYLE}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                Zonas ({draw.shapes.length})
              </p>
              {draw.shapes.length > 0 && (
                <button
                  type="button"
                  onClick={draw.clearAll}
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <Trash2 size={12} /> Limpiar
                </button>
              )}
            </div>
            <HotspotShapeList
              shapes={draw.shapes}
              mode={mode}
              selectedId={draw.selectedId}
              onSelect={draw.setSelectedId}
              onUpdate={draw.updateShape}
              onRemove={draw.removeShape}
            />
          </div>

          {draw.shapes.length > 0 && (
            <div className="rounded-xl p-3" style={PANEL_STYLE}>
              <p className="mb-2 text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                JSON para building.json
              </p>
              <textarea
                readOnly
                value={exported}
                rows={8}
                className="w-full resize-y rounded p-2 font-mono text-[10px] leading-relaxed outline-none"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.75)",
                }}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={copyExport}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ background: ACCENT, color: "#04241A" }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={downloadExport}
                  aria-label="Descargar JSON"
                  className="rounded-lg px-3 py-2 text-white"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
