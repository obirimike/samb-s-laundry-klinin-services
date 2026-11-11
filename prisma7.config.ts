import "dotenv/config";
import { defineConfig } from "@prisma/prisma7/config";

export default defineConfig({
  schema: "prisma/schema.prisma7",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim(),
  },
});
