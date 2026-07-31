import { ACCENT } from "../theme";

/** Marcador mientras se descarga una vista 3D de carga diferida. */
export default function SceneSkeleton({ label, height = "clamp(400px, 60vh, 680px)" }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-3 rounded-xl"
      style={{ height, background: "#0D1113", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full"
        style={{ border: "2px solid rgba(255,255,255,0.15)", borderTopColor: ACCENT }}
      />
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </p>
    </div>
  );
}
