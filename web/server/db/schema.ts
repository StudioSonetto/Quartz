import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

const ltree = customType<{ data: string }>({ dataType: () => "ltree" });

export const nodeType = pgEnum("node_type", [
  "core.group",
  "core.text",
  "webgl.canvas",
  "webgl.object",
  "core.image",
  "core.shape",
]);

export const componentType = pgEnum("component_type", [
  "core.animation",
  "core.base",
  "webgl.camera",
  "core.layout",
  "webgl.model",
  "webgl.scene",
  "core.transform",
  "core.typography",
  "webgl.transform",
  "core.image",
  "core.event",
  "core.shape",
  "core.path",
]);

export const lapidaries = pgTable.withRLS(
  "lapidaries",
  {
    id: uuid("id")
      .default(sql`auth.uid()`)
      .primaryKey(),
    name: text("name"),
  },
  (t) => [
    unique("lapidaries_id_key").on(t.id),
    pgPolicy("lapidaries_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.id} = auth.uid()`,
    }),
  ],
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
    pgPolicy("decks_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.lapidarist} = auth.uid()`,
    }),
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
    pgPolicy("slides_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from decks d where d.id = ${t.deck} and d.lapidarist = auth.uid())`,
    }),
  ],
);

export const nodes = pgTable.withRLS(
  "nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    path: ltree("path").notNull(),
    reference: text("reference"),
    unsynced: text("unsynced").array(),
    locked: boolean("locked").notNull().default(false),
    slides: uuid("slides").notNull(),
    type: nodeType("type").notNull(),
    sort_order: smallint("sort_order").notNull().default(0),
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
    index("nodes_path_idx").using("gist", t.path),
    pgPolicy("nodes_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from slides s join decks d on d.id = s.deck where s.id = ${t.slides} and d.lapidarist = auth.uid())`,
    }),
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
    pgPolicy("components_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from nodes n join slides s on s.id = n.slides join decks d on d.id = s.deck where n.id = ${t.node} and d.lapidarist = auth.uid())`,
    }),
  ],
);
