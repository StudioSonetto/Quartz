const SAMPLE = `function greet(name: string) {\n  return \`Hello, \${name}\`;\n}`;

export default {
  type: "core.code",
  label: "Code Block",
  accepts: [],
  parents: ["core.group"],
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 720, height: "auto" } } },
    {
      type: "core.typography",
      data: { content: SAMPLE, size: 20, lineHeight: 1.5 },
    },
    "core.syntax",
  ],
  ai: true,
} satisfies NodeTypeData;
