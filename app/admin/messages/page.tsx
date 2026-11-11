import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ContactMessageManager from "@/components/admin/ContactMessageManager";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Fmessages");
  if (session.user.role !== "ADMIN") redirect("/account");

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serializedMessages = messages.map((m: any) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

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
              <MessageSquare size={28} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Customer communication
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                Contact messages &amp; inquiries
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Review customer inquiries submitted through the contact form, mark
            them as resolved, or archive them once addressed.
          </p>

          <div className="mt-8">
            <ContactMessageManager initialMessages={serializedMessages} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
