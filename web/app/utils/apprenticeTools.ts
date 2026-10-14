import type Anthropic from "@anthropic-ai/sdk";
import {
  allNodeTypes,
  allComponentTypes,
  canContain,
} from "~/modules/registry";
import { schemaOf } from "~/utils/apprenticeSchema";
import { entryType } from "~/utils/normaliseComponents";

const object = (
  properties: Record<string, unknown> = {},
): Anthropic.Tool["input_schema"] => ({
  type: "object",
  properties,
  required: Object.keys(properties),
});

const str = { type: "string" };

export const APPRENTICE_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_deck",
    description:
      "Slides in order, each with its node tree (id, type, name, parent) and component data.",
    input_schema: object(),
  },
  {
    name: "add_slide",
    description:
      "Add a blank slide at the end. Returns its slide id and root node id.",
    input_schema: object(),
  },
  {
    name: "delete_slide",
    description: "Delete a slide. The last remaining slide can't be deleted.",
    input_schema: object({ slide: str }),
  },
  {
    name: "create_node",
    description:
      "Create a node of a registered type under a parent node on a slide. Returns the new node id.",
    input_schema: object({ slide: str, parent: str, type: str, name: str }),
  },
  {
    name: "remove_node",
    description:
      "Remove a node and everything inside it. Slide roots can't be removed.",
    input_schema: object({ node: str }),
  },
  {
    name: "add_component",
    description: "Attach an optional component type to a node.",
    input_schema: object({ node: str, type: str }),
  },
  {
    name: "remove_component",
    description: "Remove an optional component from a node.",
    input_schema: object({ node: str, type: str }),
  },
  {
    name: "set_component",
    description:
      "Merge fields into a node's component data. Objects merge; arrays and values replace. Fields must match the type's schema in the catalogue.",
    input_schema: object({ node: str, type: str, patch: { type: "object" } }),
  },
  {
    name: "look",
    description:
      "Render a slide to an image to check layout, overlap and overflow.",
    input_schema: object({ slide: str }),
  },
];

export function typeCatalogue() {
  const nodes = allNodeTypes().map((t) => ({
    type: t.type,
    label: t.label,
    accepts: allNodeTypes()
      .filter((c) => canContain(t.type, c.type))
      .map((c) => c.type),
    components: t.defaultComponents.map(entryType),
    about: t.ai?.description,
  }));

  const components = allComponentTypes().map((t) => ({
    type: t.type,
    optional: !!t.optional,
    about: t.ai?.description,
    fields: t.ai?.fields,
    schema: schemaOf({ ...t.defaultData(), ...t.ai?.items }),
  }));

  return `Node types:\n${JSON.stringify(nodes, null, 1)}\n\nComponent types:\n${JSON.stringify(components, null, 1)}`;
}

export const APPRENTICE_GUIDANCE = `You are Apprentice, drafting slide decks inside Quartz, a slides editor.
A deck is slides; a slide is a tree of nodes under a root node; nodes hold their data in components.
The canvas is 1920×1080. Prefer grid layout (core.layout) over manual positions. Animation runs on one clock per slide.
House rules:
- One idea per slide. Consistent colours and type across the deck.
- Entrances: ease-out, under 500 ms.
- Never invent statistics or quotes. Use [placeholder] brackets and list them for the user at the end.
- Build on the blank slides that already exist rather than deleting them; add_slide only when you need more.
- After building a slide, call look and fix overlap or text running off the canvas.
Start with get_deck to see what exists.`;

export const apprenticeSystem = () =>
  `${APPRENTICE_GUIDANCE}\n\n${typeCatalogue()}`;
