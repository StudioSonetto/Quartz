import { defineModule } from "../registry";

import { createWebglApi } from "./lib/renderer";

import type { WebglApi } from "./types";

const nodeTypes = Object.values(
  import.meta.glob("./nodes/*.ts", { eager: true, import: "default" }),
) as NodeTypeDef[];

let cached: WebglApi | null = null;

// Built on first use, not at registration: the lookup needs the deck store,
// which only exists once Pinia is active.
function api() {
  if (!cached) {
    const { getNodeComponent } = useNodeComponents();

    cached = createWebglApi((node, type) => getNodeComponent(node.id, type));
  }

  return cached;
}

const webglApi: WebglApi = {
  ensureCanvasContext: (node) => api().ensureCanvasContext(node),
  getCanvasContext: (id) => api().getCanvasContext(id),
  syncObject: (context, node) => api().syncObject(context, node),
  setupCanvas: (id) => api().setupCanvas(id),
};

export const webgl = defineModule({
  id: "webgl",
  nodeTypes,
  componentTypes: Object.values(
    import.meta.glob("./components/*/index.ts", {
      eager: true,
      import: "default",
    }),
  ) as ComponentTypeDef[],
  api: webglApi,
});
