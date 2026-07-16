import { defineModule } from "../registry";
import { makeCreateCommands } from "./commands/nodes";

const nodeTypes = Object.values(
  import.meta.glob("./nodes/*.ts", { eager: true, import: "default" }),
) as NodeTypeDef[];

const fileCommands = Object.values(
  import.meta.glob("./commands/*.ts", { eager: true, import: "default" }),
).flat() as Command[];

// Auto-register every default-exported definition in nodes/ and components/.
export const core = defineModule({
  id: "core",
  nodeTypes,
  componentTypes: Object.values(
    import.meta.glob("./components/*/index.ts", { eager: true, import: "default" }),
  ) as ComponentTypeDef[],
  commands: [...makeCreateCommands(nodeTypes), ...fileCommands],
});
