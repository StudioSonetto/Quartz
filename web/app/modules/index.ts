import { registerModule } from "./registry";

import { core } from "./core";

export function initModules() {
  registerModule(core);
}
