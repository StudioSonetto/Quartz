import mermaid from "mermaid";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide("mermaid", () => mermaid);
});

declare module "#app" {
  interface NuxtApp {
    $mermaid: () => typeof mermaid;
  }
}
