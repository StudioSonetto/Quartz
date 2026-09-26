import { defineContentConfig, defineCollection, z } from "@nuxt/content";
import { defineSitemapSchema } from "@nuxtjs/sitemap/content";

const schema = z.object({ sitemap: defineSitemapSchema() });

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: "page",
      source: "docs/*.md",
      schema,
    }),
    legal: defineCollection({
      type: "page",
      source: "legal/*.md",
      schema,
    }),
  },
});
