import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;
const datasourceUrl = databaseUrl ? new URL(databaseUrl) : undefined;

if (datasourceUrl) {
  datasourceUrl.searchParams.set("schema", process.env.DATABASE_SCHEMA ?? "public");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl?.toString(),
  },
});
