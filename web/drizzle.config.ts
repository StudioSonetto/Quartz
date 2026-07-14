import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: "../.env" });

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
  schemaFilter: ["public"],
});
