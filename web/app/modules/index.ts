import { registerModule } from "./registry";

import { core } from "./core";
import { webgl } from "./webgl";

export function initModules() {
  registerModule(core);
  registerModule(webgl);
}
