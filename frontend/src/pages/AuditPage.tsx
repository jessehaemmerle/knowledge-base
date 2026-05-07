import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function AuditPage() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => { api.audit().then((data) => setEntries(data.entries)); }, []);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Audit Log</h1>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-[180px_1fr_160px_1fr] gap-4 border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-400 dark:border-slate-800">
          <div>Zeit</div><div>Aktion</div><div>Benutzer</div><div>Details</div>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[180px_1fr_160px_1fr] gap-4 border-b border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
            <div className="text-slate-500">{new Date(entry.created_at).toLocaleString("de-AT")}</div>
            <div className="font-semibold">{entry.action}</div>
            <div>{entry.name || entry.email || "-"}</div>
            <div className="truncate text-slate-500">{entry.entity_type} {entry.entity_id}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
