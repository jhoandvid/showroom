/**
 * Genera assets esquemáticos provisionales para el showroom.
 *
 * Todo deriva de la geometría guardada en building.json, por lo que las figuras
 * dibujadas y sus hotspots interactivos siempre permanecen alineados:
 *
 *   exterior.svg     torre cuyas bandas provienen del `hotspot` de cada piso
 *   floors/<id>.svg  planta axonométrica; los hotspots son la proyección del
 *                    `planBox` de cada unidad
 *
 * `planBox` es la fuente de verdad de una unidad (un rectángulo en el espacio
 * del plano); `hotspot` se genera a partir de él, haciendo idempotente el script.
 *
 * Eliminar cuando estén disponibles el render y los planos reales.
 * Uso: node scripts/generate-placeholder-assets.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const building = JSON.parse(readFileSync(`${ROOT}/src/data/building.json`, "utf8"));

const EXTERIOR = { w: 1600, h: 1000 };
const PLAN = { w: 1200, h: 780 };

const round = (n) => Number(n.toFixed(1));
const pct = (value, total) => Number(((value / total) * 100).toFixed(2));

/** Límites de un polígono alineados a los ejes: [x1, y1, x2, y2]. */
function boundsOf(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

const polygon = (points) => points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");

// ---------------------------------------------------------------- proyección

/**
 * Construye un proyector axonométrico para una región del plano.
 *
 * Las coordenadas se normalizan a la región y luego se proyectan sobre un rombo
 * para que la planta se lea como un render y no como un dibujo ortogonal plano.
 */
function makeProjector({ region, canvas, cx, cy, sx, sy }) {
  const [x1, y1, x2, y2] = region;
  return (px, py) => {
    const u = (px - x1) / (x2 - x1);
    const v = (py - y1) / (y2 - y1);
    return [cx * canvas.w + (u - v) * sx * canvas.w, cy * canvas.h + (u + v) * sy * canvas.h];
  };
}

/** Proyecta las cuatro esquinas de un rectángulo del plano. */
function projectBox([x1, y1, x2, y2], project) {
  return [project(x1, y1), project(x2, y1), project(x2, y2), project(x1, y2)];
}

/** Orden de profundidad: un valor u+v mayor queda más cerca del observador. */
function depthOf([x1, y1, x2, y2]) {
  return x1 + x2 + y1 + y2;
}

const centroidOf = (points) => [
  points.reduce((s, p) => s + p[0], 0) / points.length,
  points.reduce((s, p) => s + p[1], 0) / points.length,
];

/** Desplaza verticalmente un polígono para extruir losas y muros. */
const lift = (points, dy) => points.map(([x, y]) => [x, y + dy]);

/**
 * Las dos caras laterales de una caja extruida orientadas hacia el observador.
 *
 * `projectBox` siempre genera las esquinas como [fondo, derecha, frente,
 * izquierda], por lo que las caras visibles son derecha→frente y
 * frente→izquierda; las otras quedan ocultas tras la cubierta.
 */
function visibleSideFaces(top, depth) {
  return [1, 2].map((i) => {
    const a = top[i];
    const b = top[(i + 1) % top.length];
    return { edge: [a, b], quad: [a, b, [b[0], b[1] + depth], [a[0], a[1] + depth]] };
  });
}

// ------------------------------------------------------------------ la planta

const PLAN_REGION = (() => {
  const boxes = building.floors[0].units.map((unit) => unit.planBox ?? boundsOf(unit.hotspot));
  const all = boxes.flatMap(([x1, y1, x2, y2]) => [
    [x1, y1],
    [x2, y2],
  ]);
  return boundsOf(all);
})();

const projectPlan = makeProjector({
  region: PLAN_REGION,
  canvas: PLAN,
  cx: 0.5,
  cy: 0.3,
  sx: 0.34,
  sy: 0.245,
});

const SLAB_DEPTH = 30;
const WALL_HEIGHT = 26;

/** Una unidad dibujada como bloque axonométrico. */
function unitBlock(unit) {
  const box = unit.planBox;
  const top = projectBox(box, projectPlan);
  const roof = lift(top, -WALL_HEIGHT);
  const [cx, cy] = centroidOf(roof);

  const walls = visibleSideFaces(roof, WALL_HEIGHT)
    .map(({ quad }) => `<polygon points="${polygon(quad)}" fill="#B7C1BF" stroke="#778483" stroke-width="1.5"/>`)
    .join("\n      ");

  // Núcleo húmedo junto a la esquina orientada al corredor, en el plano.
  const [bx1, by1, bx2, by2] = box;
  const wetW = (bx2 - bx1) * 0.32;
  const wetH = (by2 - by1) * 0.34;
  const wetX = unit.slot === "B" || unit.slot === "D" ? bx1 : bx2 - wetW;
  const wetY = unit.slot === "C" || unit.slot === "D" ? by1 : by2 - wetH;
  const wet = lift(projectBox([wetX, wetY, wetX + wetW, wetY + wetH], projectPlan), -WALL_HEIGHT);

  const splitAt = by1 + (by2 - by1) * (unit.bedrooms > 2 ? 0.55 : 0.62);
  const split = lift([projectPlan(bx1, splitAt), projectPlan(bx2, splitAt)], -WALL_HEIGHT);

  return `
    <g>
      ${walls}
      <polygon points="${polygon(roof)}" fill="#F1F4F3" stroke="#5C6968" stroke-width="2.5"/>
      <line x1="${round(split[0][0])}" y1="${round(split[0][1])}" x2="${round(split[1][0])}" y2="${round(split[1][1])}" stroke="#96A2A1" stroke-width="1.5"/>
      <polygon points="${polygon(wet)}" fill="#DFE6E5" stroke="#96A2A1" stroke-width="1.5"/>
      <text x="${round(cx)}" y="${round(cy - 4)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="27" font-weight="600" fill="#33413F">${unit.code}</text>
      <text x="${round(cx)}" y="${round(cy + 17)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" fill="#6C7978">${String(unit.area).replace(".", ",")} m² · ${unit.slot}</text>
    </g>`;
}

/** Planta axonométrica con un bloque por unidad. */
function planSvg(floor) {
  const { w, h } = PLAN;
  const pad = 3;
  const [rx1, ry1, rx2, ry2] = PLAN_REGION;
  const slab = projectBox([rx1 - pad, ry1 - pad, rx2 + pad, ry2 + pad], projectPlan);

  const slabSides = visibleSideFaces(slab, SLAB_DEPTH)
    .map(({ quad }) => `<polygon points="${polygon(quad)}" fill="#8E9A98"/>`)
    .join("\n  ");

  const ordered = [...floor.units].sort((a, b) => depthOf(a.planBox) - depthOf(b.planBox));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12181A"/><stop offset="100%" stop-color="#1D2426"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  ${slabSides}
  <polygon points="${polygon(slab)}" fill="#C3CBC9" stroke="#7A8685" stroke-width="2"/>

  ${ordered.map((unit) => unitBlock(unit)).join("")}

  <text x="40" y="58" font-family="system-ui,sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.88)">${floor.label}</text>
  <text x="40" y="84" font-family="system-ui,sans-serif" font-size="15" fill="rgba(255,255,255,0.4)">${floor.units.length} unidades · planta axonométrica generada</text>
</svg>
`;
}

// -------------------------------------------------------------- el exterior

/** Pseudoaleatorio estable en [0,1) para conservar la fachada entre ejecuciones. */
function jitter(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Un módulo de piso: vidriado, antepecho y, en algunos casos, balcón. */
function bay(x, y, width, height, seed) {
  const glassH = height * 0.62;
  const spandrelY = y + glassH;
  const shade = 0.82 + jitter(seed) * 0.3;
  const mullions = Array.from({ length: 3 }, (_, i) => {
    const mx = round(x + (width / 3) * (i + 1));
    return `<line x1="${mx}" y1="${round(y)}" x2="${mx}" y2="${round(y + glassH)}" stroke="#2E4448" stroke-width="1" stroke-opacity="0.55"/>`;
  }).join("");

  const balcony =
    jitter(seed + 7) > 0.55
      ? `<rect x="${round(x - 3)}" y="${round(spandrelY - 4)}" width="${round(width + 6)}" height="6" fill="#D3D9D7"/>
         <rect x="${round(x - 3)}" y="${round(spandrelY - 20)}" width="${round(width + 6)}" height="16" fill="#8FB6B4" fill-opacity="0.34" stroke="#C6CFCD" stroke-width="0.8"/>`
      : "";

  return `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(glassH)}" fill="url(#glass)" opacity="${shade.toFixed(2)}"/>
      ${mullions}
      <rect x="${round(x)}" y="${round(spandrelY)}" width="${round(width)}" height="${round(height - glassH)}" fill="#DCE1DF"/>
      ${balcony}`;
}

/** Banda de piso de la fachada, dividida en un módulo por unidad. */
function floorBand(band, slots, level) {
  const inset = band.width * 0.035;
  const cell = (band.width - inset * 2) / slots;
  const bays = Array.from({ length: slots }, (_, i) =>
    bay(band.x + inset + cell * i + 2, band.y + 2, cell - 4, band.height - 4, level * 10 + i),
  ).join("\n      ");

  return `<g>
      <rect x="${round(band.x)}" y="${round(band.y)}" width="${round(band.width)}" height="${round(band.height)}" fill="#EBEEED"/>
      ${bays}
      <line x1="${round(band.x)}" y1="${round(band.y)}" x2="${round(band.x + band.width)}" y2="${round(band.y)}" stroke="#AEB7B5" stroke-width="1.2"/>
      <text x="${round(band.x - 16)}" y="${round(band.y + band.height / 2 + 5)}" text-anchor="end" font-family="system-ui,sans-serif" font-size="15" fill="#8C9896">${level}</text>
    </g>`;
}

/** Cielo, nubes y perfil urbano distante detrás de la torre. */
function skyMarkup(horizonY) {
  const clouds = [
    [300, 150, 190, 34],
    [820, 96, 150, 26],
    [1290, 190, 210, 30],
  ]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#8FA3AC" opacity="0.16" filter="url(#soft)"/>`)
    .join("");

  const skyline = Array.from({ length: 26 }, (_, i) => {
    const w = 40 + jitter(i) * 60;
    const h = 40 + jitter(i + 40) * 120;
    const x = -20 + i * 64;
    return `<rect x="${round(x)}" y="${round(horizonY - h)}" width="${round(w)}" height="${round(h)}" fill="#28353A" opacity="0.55"/>`;
  }).join("");

  return `${clouds}${skyline}`;
}

/** Plaza, vegetación y sombra proyectada por la torre. */
function groundMarkup({ x, x2, y2 }, canvasW, canvasH) {
  // Las copas apoyan sobre la rasante: cada círculo termina apenas debajo de y2.
  const trees = [
    [x - 156, 48],
    [x - 78, 34],
    [x2 + 104, 44],
    [x2 + 182, 30],
  ]
    .map(([cx, r]) => {
      const cy = y2 + 8 - r;
      return `<ellipse cx="${round(cx + 10)}" cy="${round(y2 + 12)}" rx="${round(r * 0.85)}" ry="${round(r * 0.2)}" fill="#0F1817" opacity="0.55"/>
         <circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="#2C4C43"/>
         <circle cx="${round(cx - r * 0.24)}" cy="${round(cy - r * 0.26)}" r="${round(r * 0.6)}" fill="#3A6355" opacity="0.9"/>`;
    })
    .join("");

  return `<rect x="0" y="${round(y2)}" width="${canvasW}" height="${round(canvasH - y2)}" fill="#39474A"/>
  <rect x="0" y="${round(y2)}" width="${canvasW}" height="26" fill="#455457"/>
  <ellipse cx="${round((x + x2) / 2 + 90)}" cy="${round(y2 + 26)}" rx="${round((x2 - x) * 0.78)}" ry="34" fill="#111A1B" opacity="0.55"/>
  ${trees}`;
}

function exteriorSvg() {
  const { w, h } = EXTERIOR;
  const bands = building.floors.map((floor) => {
    const [x1, y1, x2, y2] = boundsOf(floor.hotspot);
    return {
      floor,
      band: { x: (x1 / 100) * w, y: (y1 / 100) * h, width: ((x2 - x1) / 100) * w, height: ((y2 - y1) / 100) * h },
    };
  });
  const tower = bands.reduce(
    (acc, { band }) => ({
      x: Math.min(acc.x, band.x),
      y: Math.min(acc.y, band.y),
      x2: Math.max(acc.x2, band.x + band.width),
      y2: Math.max(acc.y2, band.y + band.height),
    }),
    { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity },
  );
  const towerW = tower.x2 - tower.x;

  const floorBands = bands
    .map(({ floor, band }) => floorBand(band, floor.units.length, floor.level))
    .join("\n    ");

  // Cara lateral angosta a la derecha, solo para aportar profundidad. Las bandas
  // interactivas permanecen sobre la fachada frontal descrita por los hotspots.
  const sideW = towerW * 0.16;
  const sideSkew = 26;
  const side = `<polygon points="${round(tower.x2)},${round(tower.y)} ${round(tower.x2 + sideW)},${round(tower.y + sideSkew)} ${round(tower.x2 + sideW)},${round(tower.y2 + sideSkew * 0.4)} ${round(tower.x2)},${round(tower.y2)}" fill="#7C8C8E"/>
  <polygon points="${round(tower.x2)},${round(tower.y)} ${round(tower.x2 + sideW)},${round(tower.y + sideSkew)} ${round(tower.x2 + sideW)},${round(tower.y2 + sideSkew * 0.4)} ${round(tower.x2)},${round(tower.y2)}" fill="url(#sideShade)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141C26"/><stop offset="55%" stop-color="#2E3D47"/>
      <stop offset="88%" stop-color="#55636A"/><stop offset="100%" stop-color="#6E7A74"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#9EC3BE"/><stop offset="45%" stop-color="#6E9698"/>
      <stop offset="100%" stop-color="#3B565C"/>
    </linearGradient>
    <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.24"/><stop offset="100%" stop-color="#000" stop-opacity="0.46"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.16"/><stop offset="38%" stop-color="#fff" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${skyMarkup(tower.y2)}
  ${groundMarkup(tower, w, h)}

  ${side}

  <!-- Parapeto y sala de máquinas en la cubierta. -->
  <rect x="${round(tower.x - 18)}" y="${round(tower.y - 30)}" width="${round(towerW + 36 + sideW * 0.5)}" height="30" fill="#D8DEDC"/>
  <rect x="${round(tower.x - 18)}" y="${round(tower.y - 30)}" width="${round(towerW + 36 + sideW * 0.5)}" height="7" fill="#EFF2F1"/>
  <rect x="${round(tower.x + towerW * 0.4)}" y="${round(tower.y - 70)}" width="${round(towerW * 0.2)}" height="40" fill="#C2CAC8"/>

  <g>
    ${floorBands}
  </g>

  <rect x="${round(tower.x)}" y="${round(tower.y)}" width="${round(towerW)}" height="${round(tower.y2 - tower.y)}" fill="url(#sheen)"/>
  <rect x="${round(tower.x)}" y="${round(tower.y)}" width="${round(towerW)}" height="${round(tower.y2 - tower.y)}" fill="none" stroke="#9EA9A7" stroke-width="2"/>

  <!-- Vestíbulo en planta baja. -->
  <rect x="${round(tower.x + towerW * 0.3)}" y="${round(tower.y2 - 4)}" width="${round(towerW * 0.4)}" height="4" fill="#C9D1CF"/>

  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
  <text x="${w / 2}" y="${round(h - 24)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.4)">${building.name} · imagen de referencia generada</text>
</svg>
`;
}

// ------------------------------------------------------------------- salida

mkdirSync(`${ROOT}/public/building/floors`, { recursive: true });

// Primero normaliza los datos: los rectángulos de planta definen todo lo demás.
building.floors.forEach((floor) => {
  floor.units.forEach((unit) => {
    unit.planBox = unit.planBox ?? boundsOf(unit.hotspot);
  });
});

writeFileSync(`${ROOT}/public/building/exterior.svg`, exteriorSvg());
building.floors.forEach((floor) => {
  writeFileSync(`${ROOT}/public/building/floors/${floor.id}.svg`, planSvg(floor));
});

// Los hotspots siguen la proyección para coincidir con las zonas dibujadas.
building.exteriorImage = "/building/exterior.svg";

building.floors.forEach((floor) => {
  floor.planImage = `/building/floors/${floor.id}.svg`;
  floor.units.forEach((unit) => {
    const roof = lift(projectBox(unit.planBox, projectPlan), -WALL_HEIGHT);
    unit.hotspot = roof.map(([x, y]) => [pct(x, PLAN.w), pct(y, PLAN.h)]);
  });
});

writeFileSync(`${ROOT}/src/data/building.json`, `${JSON.stringify(building, null, 2)}\n`);

console.log(`exterior.svg · ${building.floors.length} plantas axonométricas`);
console.log("hotspots de unidad reproyectados desde planBox");
