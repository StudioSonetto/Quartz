import { describe, it, expect, beforeEach } from "vitest";
import { registerModule, allCommands, getCommand, __resetRegistry } from "./registry";
import { core } from "./core";
import type { CommandContext } from "#shared/types";

const ctx = (over: Partial<CommandContext>): CommandContext =>
  ({ selectedNode: null, activeTab: 0, focus: null, deckId: "d1", deck: {}, atelier: {}, ...over }) as any;

describe("core commands", () => {
  beforeEach(() => {
    __resetRegistry();
    registerModule(core);
  });

  it("registers a create command per creatable node type", () => {
    const createIds = allCommands().map((c) => c.id).filter((id) => id.startsWith("core.node.create."));
    expect(createIds).toContain("core.node.create.group");
    expect(createIds).toContain("core.node.create.text");
    expect(createIds.length).toBeGreaterThan(0);
  });

  it("delete command is disabled with no selection and enabled for a non-root node", () => {
    const del = getCommand("core.node.delete")!;
    expect(del.when!(ctx({ selectedNode: null }))).toBe(false);
    expect(del.when!(ctx({ selectedNode: { path: "root" } as any }))).toBe(false);
    expect(del.when!(ctx({ selectedNode: { path: "root.nabc", type: "group" } as any }))).toBe(true);
  });

  it("create-group is gated by containment (group into text is disabled)", () => {
    const createGroup = getCommand("core.node.create.group")!;
    expect(createGroup.when!(ctx({ selectedNode: { type: "text" } as any }))).toBe(false);
    expect(createGroup.when!(ctx({ selectedNode: null }))).toBe(true); // defaults to root/group parent
  });

  it("slide next/prev gate on index bounds", () => {
    const next = getCommand("core.slide.next")!;
    expect(next.when!(ctx({ deck: { currentSlidesIndex: 0, slides: [1, 2] } as any }))).toBe(true);
    expect(next.when!(ctx({ deck: { currentSlidesIndex: 1, slides: [1, 2] } as any }))).toBe(false);
  });
});
