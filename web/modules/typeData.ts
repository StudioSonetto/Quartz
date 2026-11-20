import {
  addServerTemplate,
  addTypeTemplate,
  defineNuxtModule,
  getLayerDirectories,
  resolveFiles,
} from "@nuxt/kit";

const ID = "#quartz/type-data";

// The server can't use import.meta.glob, so this lists every type's data.ts
// across core and all layers at build time. New type folders need a dev restart.
export default defineNuxtModule({
  meta: { name: "quartz-type-data" },
  setup(_, nuxt) {
    addServerTemplate({
      filename: ID,
      async getContents() {
        const layers = getLayerDirectories(nuxt).map(({ app }) =>
          resolveFiles(app, "modules/*/{nodes,components}/*/data.ts"),
        );
        const files = (await Promise.all(layers)).flat();
        const kindOf = (f: string) =>
          f.match(
            /\/modules\/[^/]+\/(nodes|components)\/[^/]+\/data\.ts$/,
          )?.[1];
        const list = (kind: string) =>
          files.flatMap((f, i) => (kindOf(f) === kind ? [`t${i}`] : []));
        return [
          ...files.map((f, i) => `import t${i} from ${JSON.stringify(f)};`),
          `export const nodeTypes = [${list("nodes")}];`,
          `export const componentTypes = [${list("components")}];`,
        ].join("\n");
      },
    });

    addTypeTemplate(
      {
        filename: "types/quartz-type-data.d.ts",
        getContents: () => `declare module "${ID}" {
  export const nodeTypes: import("#shared/types").NodeTypeData[];
  export const componentTypes: import("#shared/types").ComponentTypeData[];
}`,
      },
      { nitro: true },
    );
  },
});
