import Panel from "./Panel.vue";

export default {
  type: "core.image",
  icon: "i-carbon-image",
  inspector: Panel,
  defaultData: () => ({
    src: "",
    fit: "cover",
    borderRadius: 0,
    opacity: 1,
    volume: 1,
    muted: false,
    loop: false,
    start: 0,
    duration: 0,
  }),
  unkeyed: ["start", "duration"],
  clock: (data: Record<string, any>) =>
    assetKind(data.src ?? "") === "video"
      ? mediaSpan(data as MediaTiming)
      : undefined,
};
