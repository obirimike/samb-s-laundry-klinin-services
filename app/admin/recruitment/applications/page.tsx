import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ApplicationListManager from "@/components/admin/recruitment/ApplicationListManager";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const [applications, vacancies] = await Promise.all([
    db.jobApplication.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        applicationReference: true,
        vacancyId: true,
        fullName: true,
        email: true,
        phone: true,
        location: true,
        cvFileName: true,
        cvFileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        vacancy: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    }),
    db.vacancy.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        department: true,
      },
    }),
  ]);

  const serializedApps = applications.map((app: any) => ({
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-500">Loading applications...</p>
          </div>
        }
      >
        <ApplicationListManager
          initialApplications={serializedApps}
          vacancies={vacancies}
        />
      </Suspense>
    </main>
  );
}
