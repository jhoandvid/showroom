import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

/**
 * Container for an image plus its hotspot overlay.
 *
 * Hotspot coordinates are percentages of this box, so the box has to match the
 * image exactly: the image drives the height (`h-auto`) instead of being fitted
 * into a fixed frame, which `object-contain` would letterbox and misalign.
 * When the asset is missing we fall back to a fixed-ratio placeholder so the
 * overlay still has a stable coordinate space.
 */
export default function ImageStage({ src, alt, ratio = "16 / 10", note, children }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        background: "#111416",
        aspectRatio: showImage ? undefined : ratio,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="block w-full"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <ImageIcon size={20} style={{ color: "rgba(255,255,255,0.25)" }} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {note ?? "Falta la imagen de este nivel"}
          </p>
          {src && (
            <code className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              {src}
            </code>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
