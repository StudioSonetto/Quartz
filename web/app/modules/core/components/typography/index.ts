import Panel from "./Panel.vue";
import data from "./data";
import type { Run } from "./types";

export default {
  ...data,
  icon: "i-carbon-text-font",
  inspector: Panel,
  fonts: (fields: Record<string, any>) => [
    fields.font,
    ...toRuns(fields.content).map((run: Run) => run.marks?.font),
  ],
} satisfies ComponentTypeDef;
