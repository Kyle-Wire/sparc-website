import { MODEL_NAMES } from "@/lib/model-names";
import "./house.css";

/** The lab's model tabs. Only flood has live controls today; the others say when, plainly. */
export function LabTabs() {
  return (
    <nav className="hx-tabs" aria-label="Models in the what-if lab">
      <span aria-current="page">Flood · {MODEL_NAMES.flood.name}</span>
      <span>
        Heat · {MODEL_NAMES.heat.name}
        <small>January</small>
      </span>
      <span>
        Ground · {MODEL_NAMES.ground.name}
        <small>explore</small>
      </span>
      <span>
        Wind · {MODEL_NAMES.wind.name}
        <small>2027</small>
      </span>
      <span>
        Wildfire · {MODEL_NAMES.fire.name}
        <small>fire places</small>
      </span>
    </nav>
  );
}
