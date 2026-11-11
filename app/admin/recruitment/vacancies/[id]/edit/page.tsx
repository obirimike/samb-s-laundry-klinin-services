import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VacancyForm, {
  type VacancyInitialData,
} from "@/components/admin/recruitment/VacancyForm";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVacancyPage({ params }: RouteProps) {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const { id } = await params;

  const vacancy = await db.vacancy.findUnique({
    where: { id },
  });

  if (!vacancy) {
    notFound();
  }

  const initialData: VacancyInitialData = {
    id: vacancy.id,
    title: vacancy.title,
    department: vacancy.department,
    location: vacancy.location,
    employmentType: vacancy.employmentType,
    workArrangement: vacancy.workArrangement,
    description: vacancy.description,
    responsibilities: vacancy.responsibilities,
    requirements: vacancy.requirements,
    skills: vacancy.skills,
    openings: vacancy.openings,
    deadline: vacancy.deadline ? vacancy.deadline.toISOString() : null,
    status: vacancy.status,
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <VacancyForm initialData={initialData} mode="edit" />
    </main>
  );
}
