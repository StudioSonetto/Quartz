import { defineModule } from "../registry";

const nodeTypes = Object.values(
  import.meta.glob("./nodes/*.ts", { eager: true, import: "default" }),
) as NodeTypeDef[];

export const webgl = defineModule({
  id: "webgl",
  nodeTypes,
  componentTypes: Object.values(
    import.meta.glob("./components/*/index.ts", { eager: true, import: "default" }),
  ) as ComponentTypeDef[],
});
