import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const caCertificate = process.env.SUPABASE_CA_CERT_BASE64;

const adapter = new PrismaPg({
  connectionString,
  ssl: caCertificate
    ? {
        ca: Buffer.from(caCertificate, "base64").toString("utf8"),
        rejectUnauthorized: true,
      }
    : undefined,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export type { Prisma };
