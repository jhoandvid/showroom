import { useEffect, useState } from "react";

/**
 * Router mínimo basado en el historial.
 *
 * El showroom tiene cuatro rutas estáticas y nunca navega a una URL provista por
 * el usuario, por lo que una biblioteca de enrutamiento completa solo agregaría
 * dependencias. Todas las versiones 7.x de react-router tienen avisos de seguridad
 * abiertos, varios sobre redirecciones que esta aplicación no utiliza.
 */

const NAVIGATE_EVENT = "showroom:navigate";

const ROUTES = [
  { name: "editor", pattern: /^\/editor\/?$/, keys: [] },
  {
    name: "unit",
    pattern: /^\/buildings\/(\d+)\/units\/([^/]+)\/?$/,
    keys: ["buildingId", "unitCode"],
  },
  { name: "floors", pattern: /^\/buildings\/(\d+)\/floors\/?$/, keys: ["buildingId"] },
  { name: "building", pattern: /^\/buildings\/(\d+)\/?$/, keys: ["buildingId"] },
];

/** Compara una ruta con las rutas conocidas. */
export function matchRoute(pathname) {
  for (const route of ROUTES) {
    const found = route.pattern.exec(pathname);
    if (!found) continue;
    const params = {};
    route.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(found[i + 1]);
    });
    return { name: route.name, params };
  }
  return { name: "home", params: {} };
}

/** Agrega o reemplaza una URL y notifica el cambio al router. */
export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState({}, "", to);
  else window.history.pushState({}, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

/** Se suscribe a la ruta y a los parámetros de consulta actuales. */
export function useRoute() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const sync = () => setLocation(readLocation());
    window.addEventListener("popstate", sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  const route = matchRoute(location.pathname);
  return { ...route, query: new URLSearchParams(location.search) };
}

/** Construye las URL canónicas para centralizar la forma de las rutas. */
export const urls = {
  map: () => "/",
  building: (buildingId) => `/buildings/${buildingId}`,
  floors: (buildingId, floorId) => `/buildings/${buildingId}/floors?floor=${floorId}`,
  unit: (buildingId, unitCode) => `/buildings/${buildingId}/units/${unitCode}`,
  editor: () => "/editor",
};
