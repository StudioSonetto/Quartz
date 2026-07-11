-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "componenttype" AS ENUM('animation', 'base', 'camera', 'layout', 'mesh', 'scene', 'transform', 'typography');--> statement-breakpoint
CREATE TYPE "nodetype" AS ENUM('group', 'text', 'webgl_canvas', 'webgl_object');--> statement-breakpoint
CREATE TABLE "components" (
	"type" "componenttype",
	"node" uuid,
	"data" jsonb NOT NULL,
	CONSTRAINT "components_pkey" PRIMARY KEY("type","node")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid DEFAULT gen_random_uuid() CONSTRAINT "slides_id_key" UNIQUE,
	"lapidarist" uuid NOT NULL,
	"title" text DEFAULT '''Unnamed Deck''::text' NOT NULL,
	"last_modified" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slides_pkey" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "lapidaries" (
	"id" uuid PRIMARY KEY DEFAULT auth.uid() CONSTRAINT "lapidaries_id_key" UNIQUE,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slides" uuid NOT NULL,
	"name" text NOT NULL,
	"path" ltree NOT NULL,
	"type" "nodetype" NOT NULL,
	"reference" text
);
--> statement-breakpoint
CREATE TABLE "slides" (
	"id" uuid DEFAULT gen_random_uuid(),
	"deck" uuid NOT NULL,
	"index" smallint NOT NULL,
	CONSTRAINT "slides_pkey1" PRIMARY KEY("id")
);
--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_node_fkey" FOREIGN KEY ("node") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_lapidarist_fkey" FOREIGN KEY ("lapidarist") REFERENCES "lapidaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_slides_fkey" FOREIGN KEY ("slides") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "slides" ADD CONSTRAINT "slides_deck_fkey" FOREIGN KEY ("deck") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
*/