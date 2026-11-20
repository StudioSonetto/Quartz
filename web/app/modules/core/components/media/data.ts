export default {
  type: "core.media",
  defaultData: () => ({
    src: "",
    fit: "cover",
    borderRadius: 0,
    opacity: 1,
    ...MEDIA_DEFAULTS,
  }),
  ...mediaFields("src"),
  ai: { fields: ["src", "fit"] },
} satisfies ComponentTypeData;
