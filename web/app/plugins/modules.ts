import { initModules } from "~/modules";

export default defineNuxtPlugin({
  name: "quartz-modules",
  setup() {
    initModules();
  },
});
