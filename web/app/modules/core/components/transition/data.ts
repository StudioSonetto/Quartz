export default {
  type: "core.transition",
  optional: true,
  unkeyed: ["kind", "duration", "easing"],
  defaultData: () => ({
    kind: "fade",
    duration: DEFAULT_HANDLER_DURATION,
    easing: "ease-out",
  }),
} satisfies ComponentTypeData;
