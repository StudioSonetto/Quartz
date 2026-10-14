import Panel from "./Panel.vue";

export default {
  type: "core.animation",
  icon: "i-carbon-continue-filled",
  optional: true,
  inspector: Panel,
  ai: {
    fields: {
      tracks: "keys of one component field over time; path is the field path, t is ms on the slide clock, easing is optional",
      stateKeys: "switches to a named state of core.base at time t (ms)",
    },
    items: {
      tracks: [{ type: "core.transform", path: ["position", "x"], keys: [{ t: 0, value: null }] }],
      stateKeys: [{ t: 0, name: "hover" }],
    },
  },
  defaultData: () => ({ tracks: [], stateKeys: [] }),
};
