import { defineModule } from "../registry";

// Auto-register every default-exported definition in nodes/ and components/.
export const core = defineModule({
  id: "core",
  nodeTypes: Object.values(
    import.meta.glob("./nodes/*.ts", { eager: true, import: "default" }),
  ) as NodeTypeDef[],
  componentTypes: Object.values(
    import.meta.glob("./components/*.ts", { eager: true, import: "default" }),
  ) as ComponentTypeDef[],
});
