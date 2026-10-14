import { describe, it, expect, beforeEach } from "vitest";
import { core } from "~/modules/core";
import {
  registerModule,
  defineModule,
  __resetRegistry,
} from "~/modules/registry";
import { APPRENTICE_TOOLS, typeCatalogue } from "~/utils/apprenticeTools";

describe("apprentice tools", () => {
  beforeEach(() => {
    __resetRegistry();
    registerModule(core);
  });

  it("offers the agreed tool set", () => {
    expect(APPRENTICE_TOOLS.map((t) => t.name)).toEqual([
      "get_deck",
      "add_slide",
      "delete_slide",
      "create_node",
      "remove_node",
      "add_component",
      "remove_component",
      "set_component",
      "look",
    ]);
  });

  it("lists registered node and component types with field schemas", () => {
    const catalogue = typeCatalogue();

    expect(catalogue).toContain("core.text");
    expect(catalogue).toContain("core.typography");
    expect(catalogue).toContain('"content"');
  });

  it("lists child types that name the parent themselves", () => {
    const accepts = typeCatalogue().match(
      /"type": "core.group",[^\]]*?"accepts": \[([^\]]*)\]/,
    )?.[1];

    expect(accepts).toContain("core.shape");
  });

  it("includes a module's types once registered, without core naming them", () => {
    registerModule(
      defineModule({
        id: "fake",
        nodeTypes: [
          {
            type: "fake.thing" as any,
            label: "Thing",
            icon: "",
            accepts: [],
            defaultComponents: [],
            renderer: { element: "div", render: () => ({}) },
            ai: { description: "a fake thing" },
          },
        ],
        componentTypes: [],
        commands: [],
      } as any),
    );

    expect(typeCatalogue()).toContain("fake.thing");
    expect(typeCatalogue()).toContain("a fake thing");
  });
});
