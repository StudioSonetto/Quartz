import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const nodeTypeEnum = pgEnum("nodetype", [
  "group",
  "text",
  "webgl_canvas",
  "webgl_object",
]);

export const componentTypeEnum = pgEnum("componenttype", [
  "animation",
  "base",
  "camera",
  "layout",
  "mesh",
  "scene",
  "transform",
  "typography",
]);

export const lapidaries = pgTable("lapidaries", {
  id: uuid("id").primaryKey(),
  name: text("name"),
});

export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  lapidarist: uuid("lapidarist")
    .notNull()
    .references(() => lapidaries.id),
  last_modified: timestamp("last_modified", { withTimezone: true })
    .defaultNow()
    .notNull(),
  title: text("title").notNull().default(""),
});

export const slides = pgTable("slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  deck: uuid("deck")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  index: integer("index").notNull(),
});

export const nodes = pgTable("nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  reference: text("reference"),
  slides: uuid("slides")
    .notNull()
    .references(() => slides.id, { onDelete: "cascade" }),
  type: nodeTypeEnum("type").notNull(),
});

export const components = pgTable(
  "components",
  {
    node: uuid("node")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    type: componentTypeEnum("type").notNull(),
    data: jsonb("data").notNull().default({}),
  },
  (t) => [primaryKey({ columns: [t.node, t.type] })],
);
