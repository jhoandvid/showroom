import HotspotEditor from "./hotspots/HotspotEditor";
import BuildingView from "./views/BuildingView";
import FloorView from "./views/FloorView";
import MapView from "./views/MapView";
import UnitView from "./views/UnitView";
import { useRoute } from "./router/router";

/** Resuelve la ruta encontrada a su vista correspondiente. */
function renderRoute(route) {
  switch (route.name) {
    case "editor":
      return <HotspotEditor />;
    case "unit":
      return <UnitView unitCode={route.params.unitCode} />;
    case "floors":
      return <FloorView floorId={route.query.get("floor")} />;
    case "building":
      return <BuildingView />;
    default:
      return <MapView />;
  }
}

export default function App() {
  const route = useRoute();

  return (
    <div className="min-h-screen" style={{ background: "#08090A" }}>
      {renderRoute(route)}
    </div>
  );
}
