import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

/**
 * Contenedor para una imagen y su capa de hotspots.
 *
 * Las coordenadas son porcentajes de esta caja, que debe coincidir exactamente
 * con la imagen. La imagen define la altura (`h-auto`) en vez de ajustarse a un
 * marco fijo, ya que `object-contain` agregaría bandas y desalinearía las zonas.
 * Si falta el asset se usa un marcador de proporción fija para conservar un
 * espacio de coordenadas estable.
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
