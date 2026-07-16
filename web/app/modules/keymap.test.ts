import { describe, it, expect, beforeEach } from "vitest";
import { registerModule, getCommand, __resetRegistry } from "./registry";
import { core } from "./core";
import { defaultKeymap, resolveCombo, comboForCommand } from "~/utils/keymap";

describe("keymap", () => {
  beforeEach(() => {
    __resetRegistry();
    registerModule(core);
  });

  it("every mapped commandId resolves to a registered command", () => {
    for (const id of Object.values(defaultKeymap)) {
      expect(getCommand(id), `unmapped command: ${id}`).toBeDefined();
    }
  });

  it("resolveCombo returns the bound command id", () => {
    expect(resolveCombo("mod+k")).toBe("core.view.palette");
    expect(resolveCombo("nope")).toBeUndefined();
  });

  it("comboForCommand reverse-resolves a hint", () => {
    expect(comboForCommand("core.view.palette")).toBe("mod+k");
    expect(comboForCommand("core.node.create.text")).toBeUndefined();
  });
});
