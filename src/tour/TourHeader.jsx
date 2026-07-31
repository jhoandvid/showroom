import { MapPin, MessageCircle } from "lucide-react";
import { ACCENT } from "../theme";
import { PROJECT } from "./tourConfig";

/** Construye el enlace de consulta de WhatsApp precompletado para el capítulo actual. */
function whatsappUrl(project, chapterLabel) {
  const message = `Hola, quiero más información sobre ${project.name} (${project.unit}). Estaba viendo: ${chapterLabel}.`;
  return `https://wa.me/${project.whatsappPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Identidad del proyecto y llamado de contacto fijados en la parte superior.
 *
 * `project` permite que una página de unidad reemplace los valores predeterminados
 * para que la consulta mencione la unidad que el visitante está viendo.
 */
export default function TourHeader({ chapterLabel, project = PROJECT }) {
  return (
    <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-4">
      <div>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.2em]"
          style={{ color: ACCENT }}
        >
          {project.tagline}
        </p>
        <h1 className="mt-1 text-lg font-medium text-white">{project.name}</h1>
        <div
          className="mt-1 flex items-center gap-1 text-xs"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <MapPin size={12} />
          <span>{project.location}</span>
        </div>
      </div>
      <a
        href={whatsappUrl(project, chapterLabel)}
        target="_blank"
        rel="noreferrer"
        onPointerDown={(event) => event.stopPropagation()}
        className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
        style={{ background: ACCENT, color: "#04241A" }}
      >
        <MessageCircle size={14} />
        Contactar
      </a>
    </div>
  );
}
