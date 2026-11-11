import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VacancyListManager from "@/components/admin/recruitment/VacancyListManager";

export const dynamic = "force-dynamic";

export default async function AdminVacanciesPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const vacancies = await db.vacancy.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  const serialized = vacancies.map((v: any) => ({
    ...v,
    deadline: v.deadline ? v.deadline.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <VacancyListManager initialVacancies={serialized} />
    </main>
  );
}
