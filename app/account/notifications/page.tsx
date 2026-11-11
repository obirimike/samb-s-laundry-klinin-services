import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import NotificationsList from "@/components/dashboard/notifications-list";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <a
            href="/account"
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            ← Back to dashboard
          </a>

          <div className="mt-6">
            <NotificationsList
              initialNotifications={notifications.map((notification: any) => ({
                ...notification,
                createdAt: notification.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}