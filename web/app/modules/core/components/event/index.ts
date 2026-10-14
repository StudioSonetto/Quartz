import Panel from "./Panel.vue";

export default {
  type: "core.event",
  icon: "i-carbon-cursor-1",
  optional: true,
  inspector: Panel,
  ai: {
    fields: {
      handlers:
        'on: "click" | "hover" | "key" | "enter"; action: "setState" | "toggleState" | "animate" | "seek" | "nextSlide" | "prevSlide" | "goToSlide"; optional key, state, duration, time, slide',
    },
    items: { handlers: [{ on: "click", action: "nextSlide" }] },
  },
  defaultData: () => ({ handlers: [] }),
};
