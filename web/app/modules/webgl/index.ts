import { defineModule } from "../registry";

import type { CanvasContext, WebglApi } from "./types";

const nodeTypes = Object.values(
  import.meta.glob("./nodes/*.ts", { eager: true, import: "default" }),
) as NodeTypeDef[];

let apiImpl: WebglApi | null = null;

export function provideWebglApi(impl: WebglApi) {
  apiImpl = impl;
}

export const webgl = defineModule({
  id: "webgl",
  nodeTypes,
  componentTypes: Object.values(
    import.meta.glob("./components/*/index.ts", {
      eager: true,
      import: "default",
    }),
  ) as ComponentTypeDef[],
  api: {
    ensureCanvasContext: (node: Tree) =>
      apiImpl!.ensureCanvasContext(node),
    getCanvasContext: (id: string) => apiImpl!.getCanvasContext(id),
    syncObject: (context: CanvasContext, node: Tree) =>
      apiImpl!.syncObject(context, node),
  } as WebglApi,
});
