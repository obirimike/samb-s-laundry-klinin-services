
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminNavigation from "@/components/admin/AdminNavigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
      <AdminNavigation />
      <div
        id="admin-main-content"
        className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto lg:overscroll-contain"
      >
        {children}
      </div>
    </div>
  );
}
