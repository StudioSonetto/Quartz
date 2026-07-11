import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	components: {
		nodeRelation: r.one.nodes({
			from: r.components.node,
			to: r.nodes.id
		}),
	},
	nodes: {
		components: r.many.components(),
		slide: r.one.slides({
			from: r.nodes.slides,
			to: r.slides.id
		}),
	},
	decks: {
		lapidary: r.one.lapidaries({
			from: r.decks.lapidarist,
			to: r.lapidaries.id
		}),
		slides: r.many.slides(),
	},
	lapidaries: {
		decks: r.many.decks(),
	},
	slides: {
		nodes: r.many.nodes(),
		deckRelation: r.one.decks({
			from: r.slides.deck,
			to: r.decks.id
		}),
	},
}))