
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Fcustomers");
  if (session.user.role !== "ADMIN") redirect("/account");

  const { q = "" } = await searchParams;
  const query = q.trim();

  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} /> Admin dashboard
          </Link>

          <div className="mt-7">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              Customer management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Customers
            </h1>
            <p className="mt-3 text-slate-600">
              Search customer accounts and review their booking activity.
            </p>
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search name, email, or phone"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Search customers
            </button>
            {query && (
              <Link
                href="/admin/customers"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Customer directory
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {customers.length} customer
                  {customers.length === 1 ? "" : "s"} shown
                  {customers.length === 100 ? " (maximum per page)" : ""}
                </p>
              </div>
              <Users className="text-blue-700" size={23} />
            </div>

            {customers.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-900">
                  No customers found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try another name, email address, or phone number.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customers.map((customer: any) => (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="flex flex-col justify-between gap-4 p-5 hover:bg-slate-50 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {customer.name}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            customer.accountStatus === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {customer.accountStatus}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {customer.email}
                      </p>
                      {customer.phone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {customer.phone}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Joined {formatDate(customer.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
                        {customer._count.bookings} booking
                        {customer._count.bookings === 1 ? "" : "s"}
                      </span>
                      <ArrowRight size={18} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
