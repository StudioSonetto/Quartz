import Panel from "./Panel.vue";

export default {
  type: "core.animation",
  icon: "i-carbon-continue-filled",
  optional: true,
  inspector: Panel,
  defaultData: () => ({
    states: {},
    duration: 400,
    easing: "ease-out",
    delay: 0,
    repeat: 0,
    repeatType: "loop",
  }),
  migrate: (data: Record<string, any>) => {
    if (!isPlainObject(data.states)) return data;

    let changed = false;

    const states = Object.fromEntries(
      Object.entries(data.states).map(([name, state]: [string, any]) => {
        if (!isPlainObject(state?.overrides)) return [name, state];

        const overrides = Object.fromEntries(
          Object.entries(state.overrides).map(([type, value]) => {
            const next = isPlainObject(value)
              ? migrated(type as ComponentType, value)
              : value;

            changed ||= next !== value;

            return [type, next];
          }),
        );

        return [name, { ...state, overrides }];
      }),
    );

    return changed ? { ...data, states } : data;
  },
};
