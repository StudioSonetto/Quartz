import { describe, it, expect } from "vitest";
import { planLink, type LinkCandidate } from "~/utils/linkPlan";

const node = (
  id: string,
  overrides: Partial<LinkCandidate> = {},
): LinkCandidate => ({
  id,
  type: "core.text",
  name: "Footer",
  // One slide per node by default — the legal shape.
  slides: `slide-${id}`,
  data: { "core.transform": { position: { x: 0, y: 0 } } },
  ...overrides,
});

describe("planLink", () => {
  it("clears when the key is emptied", () => {
    expect(planLink([node("a")], [node("b")], "")).toEqual({ kind: "clear" });
  });

  it("links silently when founding a new group", () => {
    expect(planLink([node("a")], [], "footer")).toEqual({ kind: "link" });
  });

  it("links silently when the joining node already matches its peers", () => {
    expect(planLink([node("a")], [node("b")], "footer")).toEqual({
      kind: "link",
    });
  });

  it("asks when component data differs", () => {
    const b = node("b", {
      data: { "core.transform": { position: { x: 5, y: 0 } } },
    });
    expect(planLink([node("a")], [b], "footer")).toEqual({ kind: "choose" });
  });

  it("asks when only the name differs", () => {
    expect(planLink([node("a")], [node("b", { name: "Other" })], "footer")).toEqual(
      { kind: "choose" },
    );
  });

  it("asks when a component is present on one side only", () => {
    const b = node("b", { data: {} });
    expect(planLink([node("a")], [b], "footer")).toEqual({ kind: "choose" });
  });

  // No peers, but the selection itself would found a divergent group.
  it("asks when a multi-selection with differing state founds a new group", () => {
    const b = node("b", { name: "Other" });
    expect(planLink([node("a"), b], [], "footer")).toEqual({ kind: "choose" });
  });

  it("links a multi-selection that already agrees", () => {
    expect(planLink([node("a"), node("b")], [], "footer")).toEqual({
      kind: "link",
    });
  });

  it("rejects a link across node types", () => {
    const plan = planLink([node("a")], [node("b", { type: "core.group" })], "footer");
    expect(plan.kind).toBe("reject");
  });

  // Postgres `jsonb` doesn't preserve key order, so a peer read back from the
  // database and one held in memory routinely differ by ordering alone.
  it("treats key order in component data as irrelevant", () => {
    const a = node("a", { data: { "core.transform": { x: 1, y: 2 } } });
    const b = node("b", { data: { "core.transform": { y: 2, x: 1 } } });
    expect(planLink([a], [b], "footer")).toEqual({ kind: "link" });
  });

  // Two on one slide converge on core.transform and drag as one.
  it("rejects two selected nodes on the same slide", () => {
    const a = node("a", { slides: "slide-1" });
    const b = node("b", { slides: "slide-1" });
    expect(planLink([a, b], [], "footer").kind).toBe("reject");
  });

  it("rejects joining a slide that already holds a peer", () => {
    const a = node("a", { slides: "slide-1" });
    const peer = node("b", { slides: "slide-1" });
    expect(planLink([a], [peer], "footer").kind).toBe("reject");
  });

  it("links a group spread one node per slide", () => {
    const a = node("a", { slides: "slide-1" });
    const b = node("b", { slides: "slide-2" });
    const c = node("c", { slides: "slide-3" });
    expect(planLink([a, b], [c], "footer")).toEqual({ kind: "link" });
  });

  it("rejects a type mismatch within the selection", () => {
    const a = node("a", { type: "core.text" });
    const b = node("b", { type: "core.group" });
    const plan = planLink([a, b], [], "footer");
    expect(plan.kind).toBe("reject");
  });
});
