import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ServiceManager from "@/components/admin/service-manager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fservices");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const services = await db.service.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      imageUrl: true,
      status: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} /> Admin dashboard
          </Link>

          <div className="mt-7 flex items-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <BriefcaseBusiness size={28} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Service management
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                Cleaning and laundry services
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Maintain the services customers can request. Changes here affect
            future service listings; existing bookings keep their service
            references.
          </p>

          <div className="mt-8">
            <ServiceManager services={services} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
