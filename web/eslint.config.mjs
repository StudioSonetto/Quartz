import ts from "@typescript-eslint/parser";
import vue from "vue-eslint-parser";
import pluginVue from "eslint-plugin-vue";

const MODULES = ["webgl"].join("|");

const moduleName = {
  selector: `Literal[value=/^(${MODULES})\\./], TemplateElement[value.raw=/^(${MODULES})\\./], :matches(ImportExpression, TSImportType) Literal[value=/modules\\/(${MODULES})(\\/|$)/]`,
  message:
    "Core must never name a module. Declare a capability on NodeTypeDef, or move this into the module's own repo.",
};

const moduleImport = {
  regex: `modules/(${MODULES})(/|$)`,
  message: "Core must never import a module.",
};

const sharedReason = "shared/ is built into the server too, where app code doesn't exist.";

export default [
  { ignores: [".nuxt/**", ".output/**", "node_modules/**"] },
  {
    files: ["**/*.{ts,mts,js,mjs}"],
    languageOptions: { parser: ts },
  },
  {
    files: ["**/*.vue"],
    plugins: { vue: pluginVue },
    languageOptions: { parser: vue, parserOptions: { parser: ts } },
  },
  {
    files: ["app/**/*.{ts,mts,js,mjs,vue}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        moduleName,
        {
          selector:
            "CallExpression[callee.name='animate'][arguments.1.type=/^(ObjectExpression|TSAsExpression|TSSatisfiesExpression)$/], ImportDeclaration[source.value='motion'] > :matches(ImportSpecifier[imported.name='animate'][local.name!='animate'], ImportNamespaceSpecifier)",
          message:
            "motion writes object targets a frame late, overwriting resets. Animate a number and copy it in onUpdate: animate(0, 1, { onUpdate: (t) => ... }). Import it as plain `animate` so this check can see it.",
        },
      ],
      "no-restricted-imports": ["error", { patterns: [moduleImport] }],
    },
  },
  {
    files: ["app/**/*.vue"],
    rules: { "vue/no-restricted-syntax": ["error", moduleName] },
  },
  {
    files: ["app/components/landing/**", "app/composables/useReveal.ts"],
    rules: { "no-restricted-syntax": ["error", moduleName] },
  },
  {
    files: ["app/stores/useDeckStore.ts", "app/stores/useDeckSync.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["$fetch", "fetch"].map((name) => ({
          name,
          message: "Use useRequestFetch() so session cookies reach the server during SSR.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        { object: "globalThis", property: "$fetch", message: "Use useRequestFetch()." },
        { object: "globalThis", property: "fetch", message: "Use useRequestFetch()." },
      ],
    },
  },
  {
    files: ["shared/**/*.{ts,mts,js,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            moduleImport,
            { regex: "^(~|@)/|^(#app|#imports|pinia)(/|$)|(^|/)app/", message: `${sharedReason} Even \`import type\`.` },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        moduleName,
        {
          selector:
            "Identifier[name=/^use[A-Z]/]:not(MemberExpression > .property, Property > .key), :matches(ImportExpression, TSImportType) Literal[value=/^(~|@)\\/|(^|\\/)app\\//]",
          message: sharedReason,
        },
      ],
      "no-restricted-globals": [
        "error",
        ...["computed", "ref", "reactive", "watch", "watchEffect", "nextTick", "defineStore", "storeToRefs", "navigateTo"].map(
          (name) => ({ name, message: sharedReason }),
        ),
      ],
    },
  },
];
