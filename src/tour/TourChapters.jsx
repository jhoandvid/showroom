import { ACCENT } from "../theme";

/** Franja horizontal de accesos directos a capítulos. */
export default function TourChapters({ chapters, activeIndex, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chapters.map((chapter, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={chapter.code}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(chapter.frame)}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2"
            style={{
              border: active ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.13)",
              background: active ? `${ACCENT}1F` : "rgba(255,255,255,0.05)",
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: active ? ACCENT : "rgba(255,255,255,0.35)" }}
            >
              {chapter.code}
            </span>
            <span className="text-xs" style={{ color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
              {chapter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
