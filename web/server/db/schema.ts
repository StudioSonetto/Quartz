import { sql } from "drizzle-orm";
import {
  customType,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Drizzle doesn't support ltree, so a custom type is needed.
const ltree = customType<{ data: string }>({ dataType: () => "ltree" });

export const nodeType = pgEnum("node_type", [
  "group",
  "text",
  "webgl_canvas",
  "webgl_object",
]);

export const componentType = pgEnum("component_type", [
  "animation",
  "base",
  "camera",
  "layout",
  "mesh",
  "scene",
  "transform",
  "typography",
]);

export const lapidaries = pgTable.withRLS(
  "lapidaries",
  {
    id: uuid("id")
      .default(sql`auth.uid()`)
      .primaryKey(),
    name: text("name"),
  },
  (t) => [unique("lapidaries_id_key").on(t.id)],
);

export const decks = pgTable.withRLS(
  "decks",
  {
    id: uuid("id").defaultRandom().notNull(),
    lapidarist: uuid("lapidarist").notNull(),
    title: text("title").notNull().default("Unnamed Deck"),
    last_modified: timestamp("last_modified", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id], name: "slides_pkey" }),
    unique("slides_id_key").on(t.id),
    foreignKey({
      columns: [t.lapidarist],
      foreignColumns: [lapidaries.id],
      name: "decks_lapidarist_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const slides = pgTable.withRLS(
  "slides",
  {
    id: uuid("id").defaultRandom().notNull(),
    deck: uuid("deck").notNull(),
    index: smallint("index").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id], name: "slides_pkey1" }),
    foreignKey({
      columns: [t.deck],
      foreignColumns: [decks.id],
      name: "slides_deck_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("slides_deck_idx").on(t.deck),
  ],
);

export const nodes = pgTable.withRLS(
  "nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    path: ltree("path").notNull(),
    reference: text("reference"),
    slides: uuid("slides").notNull(),
    type: nodeType("type").notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.slides],
      foreignColumns: [slides.id],
      name: "nodes_slides_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("nodes_slides_idx").on(t.slides),
  ],
);

export const components = pgTable.withRLS(
  "components",
  {
    node: uuid("node").notNull(),
    type: componentType("type").notNull(),
    data: jsonb("data").$type<Record<string, any>>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.type, t.node], name: "components_pkey" }),
    foreignKey({
      columns: [t.node],
      foreignColumns: [nodes.id],
      name: "components_node_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);
