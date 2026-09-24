import { describe, it, expect, beforeEach } from "vitest";
import {
  registerModule,
  getNodeType,
  getComponentType,
  canContain,
  creatableTypesFor,
  __resetRegistry,
  getCommand,
  allCommands,
  setUnlockedModules,
} from "~/modules/registry";
import { isNodeLocked } from "~/utils/lock";

const node = (type: string) => ({ type }) as any;
const component = (type: string) => ({ type }) as any;

describe("registry", () => {
  beforeEach(__resetRegistry);

  it("registers and retrieves types", () => {
    registerModule({
      id: "m",
      nodeTypes: [node("core.group")],
      componentTypes: [component("core.base")],
    });
    expect(getNodeType("core.group")?.type).toBe("core.group");
    expect(getComponentType("core.base")?.type).toBe("core.base");
  });

  it("returns undefined for unknown types", () => {
    // @ts-expect-error — intentionally passing an unregistered type
    expect(getNodeType("nope")).toBeUndefined();
    // @ts-expect-error — intentionally passing an unregistered type
    expect(getComponentType("nope")).toBeUndefined();
  });

  it("last registration wins", () => {
    registerModule({ id: "a", nodeTypes: [node("core.group")], componentTypes: [] });
    registerModule({
      id: "b",
      nodeTypes: [{ ...node("core.group"), label: "second" }],
      componentTypes: [],
    });
    expect(getNodeType("core.group")?.label).toBe("second");
  });

  it("canContain reads the accepts matrix", () => {
    registerModule({
      id: "m",
      nodeTypes: [
        { ...node("core.group"), accepts: ["core.group", "core.text", "webgl.canvas"] },
        { ...node("core.text"), accepts: [] },
        { ...node("webgl.canvas"), accepts: ["webgl.object"] },
        { ...node("webgl.object"), accepts: [] },
      ],
      componentTypes: [],
    });

    expect(canContain("core.group", "core.text")).toBe(true);
    expect(canContain("core.group", "webgl.object")).toBe(false);
    expect(canContain("webgl.canvas", "webgl.object")).toBe(true);
    expect(canContain("webgl.canvas", "core.group")).toBe(false);
    expect(canContain("core.text", "core.group")).toBe(false);
    expect(canContain("webgl.object", "webgl.object")).toBe(false);
  });

  it("canContain honours a child-declared parents entry", () => {
    registerModule({
      id: "core",
      nodeTypes: [{ ...node("core.group"), accepts: ["core.group", "core.text"] }],
      componentTypes: [],
    });
    registerModule({
      id: "webgl",
      nodeTypes: [{ ...node("webgl.canvas"), accepts: [], parents: ["core.group"] }],
      componentTypes: [],
    });

    expect(canContain("core.group", "webgl.canvas")).toBe(true);
    expect(canContain("webgl.canvas", "core.group")).toBe(false);
  });

  it("creatableTypesFor includes a child that qualifies only via parents", () => {
    registerModule({
      id: "core",
      nodeTypes: [
        { ...node("core.group"), accepts: ["core.text"] },
        { ...node("core.text"), accepts: [] },
      ],
      componentTypes: [],
    });
    registerModule({
      id: "webgl",
      nodeTypes: [{ ...node("webgl.canvas"), accepts: [], parents: ["core.group"] }],
      componentTypes: [],
    });

    expect(
      creatableTypesFor("core.group")
        .map((t) => t.type)
        .sort(),
    ).toEqual(["core.text", "webgl.canvas"]);
  });

  it("canContain returns false for an unregistered parent type", () => {
    // @ts-expect-error — intentionally an unregistered type
    expect(canContain("nope", "core.group")).toBe(false);
  });
});

const command = (id: string) =>
  ({ id, title: id, category: "Test", run: () => {} }) as any;

describe("registry commands", () => {
  beforeEach(__resetRegistry);

  it("collects and retrieves commands", () => {
    registerModule({
      id: "m",
      nodeTypes: [],
      componentTypes: [],
      commands: [command("core.node.delete")],
    });
    expect(getCommand("core.node.delete")?.id).toBe("core.node.delete");
    expect(allCommands().map((c) => c.id)).toEqual(["core.node.delete"]);
  });

  it("tolerates modules without a commands slot", () => {
    registerModule({ id: "m", nodeTypes: [], componentTypes: [] });
    expect(allCommands()).toEqual([]);
  });

  it("__resetRegistry clears commands", () => {
    registerModule({
      id: "m",
      nodeTypes: [],
      componentTypes: [],
      commands: [command("x")],
    });
    __resetRegistry();
    expect(allCommands()).toEqual([]);
  });
});

describe("unlocked modules", () => {
  beforeEach(__resetRegistry);

  it("treats a node of a locked module as locked", () => {
    setUnlockedModules([]);
    const node = { type: "paid.canvas", locked: false, path: "root.a" } as any;
    expect(isNodeLocked(node)).toBe(true);
    setUnlockedModules(["paid"]);
    expect(isNodeLocked(node)).toBe(false);
  });
});
