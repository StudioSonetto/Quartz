import { defineModule } from "../registry";

const nodeTypes = Object.values(
  import.meta.glob("./nodes/*/index.ts", { eager: true, import: "default" }),
) as NodeTypeDef[];

export const core = defineModule({
  id: "core",
  nodeTypes,
  componentTypes: Object.values(
    import.meta.glob("./components/*/index.ts", {
      eager: true,
      import: "default",
    }),
  ) as ComponentTypeDef[],
  commands: Object.values(
    import.meta.glob("./commands/*.ts", { eager: true, import: "default" }),
  ).flat() as Command[],
});
