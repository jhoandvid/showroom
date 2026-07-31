export const ACCENT = "#1FAE72";
export const SURFACE = "#0B0D0E";

/** Visual treatment per commercial state of a unit. */
export const STATUS = {
  disponible: { label: "Disponible", color: "#1FAE72", fill: "rgba(31,174,114,0.28)" },
  reservado: { label: "Reservado", color: "#E8B44A", fill: "rgba(232,180,74,0.28)" },
  vendido: { label: "Vendido", color: "#E06C5A", fill: "rgba(224,108,90,0.26)" },
};

export const STATUS_ORDER = ["disponible", "reservado", "vendido"];

/** Return the status treatment, falling back to `disponible` for unknown values. */
export function statusStyle(status) {
  return STATUS[status] ?? STATUS.disponible;
}
