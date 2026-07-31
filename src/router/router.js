import { useEffect, useState } from "react";

/**
 * Minimal history-based router.
 *
 * The showroom has four static routes and never navigates to a user-supplied
 * URL, so a full routing library would only add dependency surface — every
 * react-router 7.x release currently carries open advisories, several of them
 * about the redirect handling this app does not use.
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

/** Match a pathname against the known routes. */
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

/** Push or replace a URL and let the router know it changed. */
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

/** Subscribe to the current route and query string. */
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

/** Build the canonical URLs so route shapes live in one place. */
export const urls = {
  map: () => "/",
  building: (buildingId) => `/buildings/${buildingId}`,
  floors: (buildingId, floorId) => `/buildings/${buildingId}/floors?floor=${floorId}`,
  unit: (buildingId, unitCode) => `/buildings/${buildingId}/units/${unitCode}`,
  editor: () => "/editor",
};
