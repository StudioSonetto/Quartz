import { describe, it, expect, beforeEach } from "vitest";
import {
  registerModule,
  getNodeType,
  getComponentType,
  creatableNodeTypes,
  canContain,
  __resetRegistry,
  getCommand,
  allCommands,
} from "./registry";

const node = (type: string, creatable = true) => ({ type, creatable }) as any;
const component = (type: string) => ({ type }) as any;

describe("registry", () => {
  beforeEach(__resetRegistry);

  it("registers and retrieves types", () => {
    registerModule({
      id: "m",
      nodeTypes: [node("group")],
      componentTypes: [component("base")],
    });
    expect(getNodeType("group")?.type).toBe("group");
    expect(getComponentType("base")?.type).toBe("base");
  });

  it("returns undefined for unknown types", () => {
    // @ts-expect-error — intentionally passing an unregistered type
    expect(getNodeType("nope")).toBeUndefined();
    // @ts-expect-error — intentionally passing an unregistered type
    expect(getComponentType("nope")).toBeUndefined();
  });

  it("filters creatable node types", () => {
    registerModule({
      id: "m",
      nodeTypes: [node("group"), node("hidden", false)],
      componentTypes: [],
    });
    expect(creatableNodeTypes().map((n) => n.type)).toEqual(["group"]);
  });

  it("last registration wins", () => {
    registerModule({ id: "a", nodeTypes: [node("group")], componentTypes: [] });
    registerModule({
      id: "b",
      nodeTypes: [{ ...node("group"), label: "second" }],
      componentTypes: [],
    });
    expect(getNodeType("group")?.label).toBe("second");
  });

  it("canContain reads the accepts matrix", () => {
    registerModule({
      id: "m",
      nodeTypes: [
        { ...node("group"), accepts: ["group", "text", "webgl_canvas"] },
        { ...node("text"), accepts: [] },
        { ...node("webgl_canvas"), accepts: ["webgl_object"] },
        { ...node("webgl_object"), accepts: [] },
      ],
      componentTypes: [],
    });

    expect(canContain("group", "text")).toBe(true);
    expect(canContain("group", "webgl_object")).toBe(false);
    expect(canContain("webgl_canvas", "webgl_object")).toBe(true);
    expect(canContain("webgl_canvas", "group")).toBe(false);
    expect(canContain("text", "group")).toBe(false);
    expect(canContain("webgl_object", "webgl_object")).toBe(false);
  });

  it("canContain returns false for an unregistered parent type", () => {
    // @ts-expect-error — intentionally an unregistered type
    expect(canContain("nope", "group")).toBe(false);
  });
});

const command = (id: string) => ({ id, title: id, category: "Test", run: () => {} }) as any;

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
    registerModule({ id: "m", nodeTypes: [], componentTypes: [], commands: [command("x")] });
    __resetRegistry();
    expect(allCommands()).toEqual([]);
  });
});
