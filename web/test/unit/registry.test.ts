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
} from "~/modules/registry";

const node = (type: string) => ({ type }) as any;
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

  it("canContain honours a child-declared parents entry", () => {
    registerModule({
      id: "core",
      nodeTypes: [{ ...node("group"), accepts: ["group", "text"] }],
      componentTypes: [],
    });
    registerModule({
      id: "webgl",
      nodeTypes: [{ ...node("webgl_canvas"), accepts: [], parents: ["group"] }],
      componentTypes: [],
    });

    expect(canContain("group", "webgl_canvas")).toBe(true);
    expect(canContain("webgl_canvas", "group")).toBe(false);
  });

  it("creatableTypesFor includes a child that qualifies only via parents", () => {
    registerModule({
      id: "core",
      nodeTypes: [
        { ...node("group"), accepts: ["text"] },
        { ...node("text"), accepts: [] },
      ],
      componentTypes: [],
    });
    registerModule({
      id: "webgl",
      nodeTypes: [{ ...node("webgl_canvas"), accepts: [], parents: ["group"] }],
      componentTypes: [],
    });

    expect(
      creatableTypesFor("group")
        .map((t) => t.type)
        .sort(),
    ).toEqual(["text", "webgl_canvas"]);
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
