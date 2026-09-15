import Panel from "./Panel.vue";
import type { Run } from "./types";

export default {
  type: "core.typography",
  icon: "i-carbon-text-font",
  inspector: Panel,
  fonts: (data: Record<string, any>) => [
    data.font,
    ...toRuns(data.content).map((run: Run) => run.marks?.font),
  ],
  defaultData: () => ({
    alignment: "left",
    colour: "#151515",
    content: "New Text",
    font: "Azeret Mono",
    size: 30,
    style: [],
    weight: 300,
    lineHeight: 1.2,
    letterSpacing: 0,
    textTransform: "none",
    opacity: 1,
  }),
};
