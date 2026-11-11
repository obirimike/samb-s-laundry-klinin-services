import "dotenv/config"; 
import { definePrismaConfig } from "prisma/config"; 
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config"; 

const datasourceUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "prisma/schema.prisma", // "schema" is renamed to "contract" in Prisma 8 config blocks
    migrations: {
      dir: "prisma/migrations",
    },
    db: {
      connection: datasourceUrl, // "datasource" keys are mapped under db.connection
    },
  }),
});
