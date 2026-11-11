import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ApplicationDetailView, {
  type DetailedApplication,
} from "@/components/admin/recruitment/ApplicationDetailView";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminApplicationDetailPage({ params }: RouteProps) {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const { id } = await params;

  const app = await db.jobApplication.findUnique({
    where: { id },
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
          slug: true,
          department: true,
          location: true,
          employmentType: true,
          workArrangement: true,
          status: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!app) {
    notFound();
  }

  const serializedApp: DetailedApplication = {
    ...app,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    statusHistory: app.statusHistory.map((h: any) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ApplicationDetailView initialApplication={serializedApp} />
    </main>
  );
}
