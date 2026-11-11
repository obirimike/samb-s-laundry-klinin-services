import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Faudit-logs");
  if (session.user.role !== "ADMIN") redirect("/account");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
    take: 250,
  });

  const actorsMap = new Map<string, string>();
  const actionsSet = new Set<string>();
  const entitiesSet = new Set<string>();

  const serializedLogs = logs.map((log: any) => {
    actorsMap.set(log.actor.id, log.actor.name);
    actionsSet.add(log.action);
    entitiesSet.add(log.entityType);

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      reason: log.reason,
      changes: log.changes,
      createdAt: log.createdAt.toISOString(),
      actor: {
        id: log.actor.id,
        name: log.actor.name,
        email: log.actor.email,
      },
    };
  });

  const actors = Array.from(actorsMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
  const actionTypes = Array.from(actionsSet).sort();
  const entityTypes = Array.from(entitiesSet).sort();

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

          <div className="mt-7 flex items-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <History size={28} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Governance &amp; Security
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                Administrative Audit Logs
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            A comprehensive, tamper-evident audit record of operational decisions,
            status changes, account suspensions, and record deletions across the SAMB&apos;s services management
            platform.
          </p>

          <div className="mt-8 ">
            <AuditLogViewer
              initialLogs={serializedLogs}
              actors={actors}
              actionTypes={actionTypes}
              entityTypes={entityTypes}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

