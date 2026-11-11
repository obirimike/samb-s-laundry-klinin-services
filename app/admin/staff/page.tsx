import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import StaffManagement from "@/components/admin/StaffManagement";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const members = await db.user.findMany({
    where: { role: "STAFF" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      assignmentsReceived: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  const initialStaff = members.map(
    ({ assignmentsReceived, ...member }: any) => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
      activeAssignmentCount: assignmentsReceived.length,
    })
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StaffManagement initialStaff={initialStaff} />
    </main>
  );
}
