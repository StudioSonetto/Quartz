import { registerModule } from "~/modules/registry";
import { webgl } from "~/modules/webgl";

export default defineNuxtPlugin({
  name: "quartz-webgl",
  dependsOn: ["quartz-modules"],
  setup() {
    registerModule(webgl);
  },
});
