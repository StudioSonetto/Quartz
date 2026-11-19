import ts from "@typescript-eslint/parser";
import vue from "vue-eslint-parser";

const noModuleNames = [
  {
    selector: "Literal[value=/^webgl(\\.|$)/]",
    message:
      "Core must never name a module. Declare a capability on NodeTypeDef, or move this into the module's own repo.",
  },
];

const noObjectAnimate = {
  selector: "CallExpression[callee.name='animate'][arguments.1.type='ObjectExpression']",
  message:
    "motion writes object targets a frame late, overwriting resets. Animate a number and copy it in onUpdate: animate(0, 1, { onUpdate: (t) => ... }).",
};

export default [
  { ignores: [".nuxt/**", ".output/**", "node_modules/**"] },
  {
    files: ["**/*.ts", "**/*.mjs"],
    languageOptions: { parser: ts },
  },
  {
    files: ["**/*.vue"],
    languageOptions: { parser: vue, parserOptions: { parser: ts } },
  },
  {
    files: ["app/**/*.{ts,vue}"],
    rules: {
      "no-restricted-syntax": ["error", ...noModuleNames, noObjectAnimate],
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["**/webgl", "**/webgl/**"], message: "Core must never import a module." }] },
      ],
    },
  },
  {
    files: ["app/components/landing/**", "app/composables/useReveal.ts"],
    rules: { "no-restricted-syntax": ["error", ...noModuleNames] },
  },
  {
    files: ["app/stores/useDeckStore.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "$fetch", message: "Use useRequestFetch() so session cookies reach the server during SSR." },
      ],
    },
  },
  {
    files: ["shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["~/*", "#app", "#imports", "pinia"],
              message: "shared/ is built into the server too. Keep app code out, even `import type`.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name=/^use[A-Z]/], TSTypeQuery[exprName.name=/^use[A-Z]/]",
          message: "shared/ is built into the server too. App composables and stores don't exist there.",
        },
      ],
    },
  },
];
