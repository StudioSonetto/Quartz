import { describe, expect, it } from "vitest";
import type { ComponentRow } from "~~/server/utils/peers";
import { outline, planText, type TextNode } from "~~/server/mcp/deckText";

const node = (id: string, over: Partial<TextNode> = {}): TextNode => ({
  id,
  slides: "s1",
  slide: 1,
  name: id,
  type: "core.text",
  path: `root.${id}`,
  sort_order: 0,
  reference: null,
  unsynced: null,
  locked: false,
  ...over,
});

const root = (slide: number) =>
  node(`root${slide}`, {
    slide,
    slides: `s${slide}`,
    type: "core.group",
    path: "root",
  });

const typography = (
  id: string,
  content: unknown,
  extra = {},
): ComponentRow => ({
  node: id,
  type: "core.typography",
  data: { content, size: 40, ...extra },
});

const nodes = [
  root(1),
  node("styled", { sort_order: 1 }),
  node("plain", { sort_order: 0 }),
  node("linked", { reference: "footer", sort_order: 2 }),
  node("bound", { sort_order: 3 }),
  node("own", { reference: "f", unsynced: ["core.typography"], sort_order: 4 }),
  node("held", { locked: true, sort_order: 5 }),
  node("shape", { type: "core.shape", sort_order: 6 }),
  root(2),
  node("later", { slide: 2, slides: "s2" }),
];

const rows = [
  typography("styled", [
    { text: "Hi ", marks: { bold: true } },
    { text: "there" },
  ]),
  typography("plain", "Old"),
  typography("linked", "Footer"),
  typography("bound", "", { $bind: { content: "{{ title }}" } }),
  typography("later", "Two"),
];

describe("outline", () => {
  it("lists text boxes per slide in hierarchy order, with locked ones marked", () => {
    const [first, second] = outline(nodes, rows);

    expect(
      first!.texts.map((t) => [t.id, t.text, t.length, t.editable, t.reason]),
    ).toEqual([
      ["plain", "Old", 3, true, undefined],
      ["styled", "Hi there", 8, true, undefined],
      ["linked", "Footer", 6, false, "linked — edit it in Quartz"],
      ["bound", "", 0, false, "bound to a variable"],
      ["own", "", 0, true, undefined],
      ["held", "", 0, false, "locked in Quartz"],
    ]);
    expect(second).toEqual({
      slide: 2,
      texts: [
        {
          id: "later",
          name: "later",
          text: "Two",
          length: 3,
          editable: true,
          reason: undefined,
        },
      ],
    });
  });
});

describe("planText", () => {
  it("keeps the first run's marks and leaves the input alone", () => {
    const before = structuredClone(rows);
    const { write, skipped } = planText(nodes, rows, [
      { node: "styled", text: "New" },
      { node: "plain", text: "Fresh" },
    ]);

    expect(skipped).toEqual([]);
    expect(write).toEqual([
      typography("styled", [{ text: "New", marks: { bold: true } }]),
      typography("plain", "Fresh"),
    ]);
    expect(rows).toEqual(before);
  });

  it("skips what it must not write, with a reason, and still writes the rest", () => {
    const { write, skipped } = planText(nodes, rows, [
      { node: "linked", text: "x" },
      { node: "bound", text: "x" },
      { node: "held", text: "x" },
      { node: "shape", text: "x" },
      { node: "nope", text: "x" },
      { node: "own", text: "mine" },
      { node: "plain", text: "ok" },
    ]);

    expect(skipped).toEqual([
      { node: "linked", reason: "linked — edit it in Quartz" },
      { node: "bound", reason: "bound to a variable" },
      { node: "held", reason: "locked in Quartz" },
      { node: "shape", reason: "not a text box" },
      { node: "nope", reason: "not in this deck" },
    ]);
    expect(write.map((r) => r.node)).toEqual(["own", "plain"]);
  });
});
