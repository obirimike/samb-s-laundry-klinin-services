import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import VacancyForm from "@/components/admin/recruitment/VacancyForm";

export const dynamic = "force-dynamic";

export default async function NewVacancyPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <VacancyForm mode="create" />
    </main>
  );
}
