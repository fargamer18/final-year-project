export { registerDetachedBlueprints } from "./detached";
export { registerUrbanBlueprints } from "./urban";
export { registerFarmhouseBlueprint } from "./farmhouse";

import { registerDetachedBlueprints } from "./detached";
import { registerUrbanBlueprints } from "./urban";
import { registerFarmhouseBlueprint } from "./farmhouse";

let initialized = false;

/** Call once at app startup to register all premade blueprints. */
export function initBlueprints() {
  if (initialized) return;
  registerDetachedBlueprints();
  registerUrbanBlueprints();
  registerFarmhouseBlueprint();
  initialized = true;
}
