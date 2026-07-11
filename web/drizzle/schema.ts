import { pgEnum, pgTable, uuid, text, smallint, jsonb, customType, timestamp, foreignKey, primaryKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const componenttype = pgEnum("componenttype", ["animation", "base", "camera", "layout", "mesh", "scene", "transform", "typography"])
export const nodetype = pgEnum("nodetype", ["group", "text", "webgl_canvas", "webgl_object"])


export const components = pgTable("components", {
	type: componenttype().notNull(),
	node: uuid().notNull().references(() => nodes.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	data: jsonb().notNull(),
}, (table) => [
	primaryKey({ columns: [table.type, table.node], name: "components_pkey"}),
]);

export const decks = pgTable("decks", {
	id: uuid().defaultRandom().primaryKey(),
	lapidarist: uuid().notNull().references(() => lapidaries.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	title: text().default("'Unnamed Deck'::text").notNull(),
	lastModified: timestamp("last_modified", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	unique("slides_id_key").on(table.id),]);

export const lapidaries = pgTable("lapidaries", {
	id: uuid().default(sql`auth.uid()`).primaryKey(),
	name: text(),
}, (table) => [
	unique("lapidaries_id_key").on(table.id),]);

export const nodes = pgTable("nodes", {
	id: uuid().defaultRandom().primaryKey(),
	slides: uuid().notNull().references(() => slides.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	name: text().notNull(),
	path: customType({ dataType: () => 'ltree' })().notNull(),
	type: nodetype().notNull(),
	reference: text(),
});

export const slides = pgTable("slides", {
	id: uuid().defaultRandom().primaryKey(),
	deck: uuid().notNull().references(() => decks.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	index: smallint().notNull(),
});
