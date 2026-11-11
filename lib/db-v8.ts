import "server-only";

import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "@/prisma/schema.d";
import contractJson from "@/prisma/schema.json" with { type: "json" };

export const recruitmentContract =
  contractFromJson<Contract>(contractJson);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

function createPrisma8Client() {
  return postgres({
    contract: recruitmentContract,
    url: connectionString,
    log: console,
  });
}

type Prisma8Client = ReturnType<typeof createPrisma8Client>;

const globalForPrisma8 = globalThis as typeof globalThis & {
  recruitmentPrisma8?: Prisma8Client;
};

export const recruitmentDb =
  globalForPrisma8.recruitmentPrisma8 ?? createPrisma8Client();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma8.recruitmentPrisma8 = recruitmentDb;
}
