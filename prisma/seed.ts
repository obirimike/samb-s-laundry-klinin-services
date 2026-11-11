import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ServiceCategory } from "@prisma/client";
// import * as PrismaAll from "@prisma/client";

const rawConnectionString =
  process.env.SEED_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("No database connection URL is configured.");
}

const caCertificate = process.env.SUPABASE_CA_CERT_BASE64;

const databaseUrl = new URL(rawConnectionString);

if (caCertificate) {
  for (const parameter of [
    "sslmode",
    "sslrootcert",
    "sslcert",
    "sslkey",
  ]) {
    databaseUrl.searchParams.delete(parameter);
  }
}

const adapter = new PrismaPg({
  connectionString: databaseUrl.toString(),
  ssl: caCertificate
    ? {
        ca: Buffer.from(caCertificate, "base64").toString("utf8"),
        rejectUnauthorized: true,
      }
    : undefined,
});

const prisma = new PrismaClient({ adapter });

const services = [
  // Cleaning Services
  {
    name: "Standard Cleaning",
    slug: "standard-cleaning",
    description:
      "Routine cleaning to help maintain clean, comfortable homes and workplaces.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Deep Cleaning",
    slug: "deep-cleaning",
    description:
      "Detailed cleaning for areas that need more attention than routine cleaning.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Post-Construction Cleaning",
    slug: "post-construction-cleaning",
    description:
      "Cleaning after construction or renovation to prepare a property for use.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Carpet Cleaning",
    slug: "carpet-cleaning",
    description:
      "Carpet cleaning to help remove accumulated dirt and improve cleanliness.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Upholstery Cleaning",
    slug: "upholstery-cleaning",
    description:
      "Cleaning for upholstered furniture and other suitable fabric surfaces.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Move-In / Move-Out Cleaning",
    slug: "move-in-move-out-cleaning",
    description:
      "Cleaning properties before moving in or after moving out.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Pre-Event Cleaning",
    slug: "pre-event-cleaning",
    description:
      "Cleaning and preparation of venues before events.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Post-Event Cleaning",
    slug: "post-event-cleaning",
    description:
      "Cleaning and tidying venues after events.",
    category: ServiceCategory.CLEANING,
  },
  {
    name: "Disinfection & Sanitization",
    slug: "disinfection-sanitization",
    description:
      "Cleaning and sanitization services personalized to the requirements of a space.",
    category: ServiceCategory.CLEANING,
  },

  // Laundry Services
  {
    name: "Laundry Services",
    slug: "laundry-services",
    description:
      "Laundry services including washing, drying, folding, ironing, and fabric care.",
    category: ServiceCategory.LAUNDRY,
  },

  // House Help and Domestic Support Services
  {
    name: "Provision of Domestic Helpers for Households",
    slug: "provision-of-domestic-helpers",
    description:
      "Vetted, dependable domestic helpers provided to assist with everyday household chores, routines, and family care.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
  },
  {
    name: "Housekeeping and General Home Maintenance",
    slug: "housekeeping-home-maintenance",
    description:
      "Comprehensive housekeeping, daily tidying, floor care, dusting, and ongoing home upkeep to maintain pristine living spaces.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
  },
  {
    name: "Cooking and Meal Preparation",
    slug: "cooking-meal-preparation",
    description:
      "Wholesome, customized home-cooked meals prepared in your kitchen according to your family's tastes, dietary plans, and agreed schedule.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
  },
  {
    name: "Laundry, Ironing, and Clothing Care",
    slug: "domestic-laundry-clothing-care",
    description:
      "Dedicated in-home washing, precise ironing, garment pressing, wardrobe organization, and gentle clothing care.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
  },
  {
    name: "Temporary and Regular Domestic Assistance",
    slug: "temporary-regular-domestic-assistance",
    description:
      "Flexible domestic support tailored to your schedule, whether you need temporary emergency help, holiday assistance, or ongoing regular service.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
  },

  // Fumigation and Pest Control Services
  {
    name: "Residential and Office Pest Control",
    slug: "residential-office-pest-control",
    description:
      "Targeted pest eradication treatments designed for residential homes, apartments, and corporate workspaces to keep premises pest-free.",
    category: ServiceCategory.PEST_CONTROL,
  },
  {
    name: "Cockroach, Ant, and Crawling-Insect Control",
    slug: "crawling-insect-control",
    description:
      "Specialized eradication protocols to eliminate cockroach infestations, ant colonies, and destructive crawling insects at the root.",
    category: ServiceCategory.PEST_CONTROL,
  },
  {
    name: "Rodent Control",
    slug: "rodent-control",
    description:
      "Strategic rodent management utilizing secure baiting stations, humane trapping, and structural entry-point exclusion methods.",
    category: ServiceCategory.PEST_CONTROL,
  },
  {
    name: "Pest Treatment for Commercial Premises",
    slug: "commercial-pest-treatment",
    description:
      "Industrial-grade pest control and compliant sanitation treatments tailored for warehouses, restaurants, retail outlets, and commercial buildings.",
    category: ServiceCategory.PEST_CONTROL,
  },
  {
    name: "Scheduled Pest Prevention and Maintenance",
    slug: "scheduled-pest-prevention-maintenance",
    description:
      "Proactive monitoring and routine scheduled pest barrier applications to guarantee long-term protection against re-infestation.",
    category: ServiceCategory.PEST_CONTROL,
  },
];

async function main() {
  // Clean up any legacy placeholder services if they exist and have no bookings
  await prisma.service.deleteMany({
    where: {
      slug: { in: ["domestic-support", "pest-control"] },
      bookings: { none: {} },
    },
  });

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        description: service.description,
        category: service.category,
      },
      create: service,
    });
  }

  console.log(`Successfully seeded ${services.length} SAMB services.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed services:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
