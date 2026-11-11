"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react";

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  changes: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
};

export default function AuditLogViewer({
  initialLogs,
  actors,
  actionTypes,
  entityTypes,
}: {
  initialLogs: AuditLogItem[];
  actors: { id: string; name: string }[];
  actionTypes: string[];
  entityTypes: string[];
}) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [selectedActor, setSelectedActor] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (selectedActor !== "ALL" && log.actor.id !== selectedActor) return false;
      if (selectedAction !== "ALL" && log.action !== selectedAction) return false;
      if (selectedEntity !== "ALL" && log.entityType !== selectedEntity) return false;

      if (!q) return true;

      return (
        log.action.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.actor.name.toLowerCase().includes(q) ||
        log.actor.email.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    });
  }, [logs, selectedActor, selectedAction, selectedEntity, search]);

  const getActionBadge = (action: string) => {
    if (action.includes("DELETE") || action.includes("CANCEL") || action.includes("SUSPEND")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (action.includes("CONFIRM") || action.includes("REACTIVATE") || action.includes("ACTIVATE") || action.includes("PUBLISH")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (action.includes("SENT") || action.includes("CREATE")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900">
        <ShieldCheck size={20} className="shrink-0 text-blue-700" />
        <p>
          <strong>Immutable Audit Trail:</strong> All significant administrative
          actions, status changes, suspensions, and deletions are permanently
          recorded for transparency and compliance. Audit records cannot be modified
          or deleted.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Search
            </label>
            <div className="relative mt-1.5">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ID, reason, administrator..."
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Administrator
            </label>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Administrators</option>
              {actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Actions</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Record Type
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Record Types</option>
              {entityTypes.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing {filteredLogs.length} of {logs.length} logged actions
          </span>
          {(selectedActor !== "ALL" ||
            selectedAction !== "ALL" ||
            selectedEntity !== "ALL" ||
            search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedActor("ALL");
                setSelectedAction("ALL");
                setSelectedEntity("ALL");
                setSearch("");
              }}
              className="font-semibold text-blue-700 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No audit records match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isExpanded = expandedRow === log.id;

              return (
                <div key={log.id} className="p-5 hover:bg-slate-50/70 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        className="mt-0.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        aria-label={isExpanded ? "Collapse changes" : "Expand changes"}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {log.entityType}
                          </span>
                          <span className="font-mono text-xs text-slate-400 break-all">
                            ID: {log.entityId}
                          </span>
                        </div>

                        {log.reason && (
                          <p className="mt-1 text-xs text-slate-600">
                            <strong>Reason: </strong>
                            {log.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end text-xs text-slate-500 shrink-0 pl-8 sm:pl-0">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <User size={13} />
                        <span>{log.actor.name}</span>
                      </div>
                      <span className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString("en-GH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Changes View */}
                  {isExpanded && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-200 font-mono">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-sans font-bold">
                        Recorded State Changes:
                      </p>
                      <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-emerald-400">
                        {log.changes
                          ? JSON.stringify(log.changes, null, 2)
                          : "No detailed field changes recorded."}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

