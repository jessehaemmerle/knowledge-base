import { ArrowRight, Clock, FilePlus2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { api, type PageMeta } from "../lib/api";
import { timeAgo } from "../lib/utils";

export function DashboardPage() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  useEffect(() => { api.pages().then((data) => setPages(data.pages)); }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-8 rounded-3xl border border-white/80 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">Wiki Dashboard</div>
            <h1 className="text-4xl font-extrabold tracking-tight">Willkommen zurueck.</h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Finde Wissen schnell, schreibe Seiten visuell und halte Inhalte als Markdown-Dateien backup-freundlich vor.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/editor/new"><Button><FilePlus2 className="h-4 w-4" />Neue Seite</Button></Link>
            <Link to="/pages"><Button variant="secondary"><Search className="h-4 w-4" />Alle Seiten</Button></Link>
          </div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Zuletzt geaendert</h2>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pages.slice(0, 8).map((page) => (
              <Link key={page.slug} to={`/wiki/${page.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-brand">
                <div>
                  <div className="font-semibold">{page.title}</div>
                  <div className="text-sm text-slate-500">{page.description || "Keine Beschreibung"}</div>
                </div>
                <div className="shrink-0 text-sm text-slate-400">{timeAgo(page.updated_at)}</div>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold">Schnellzugriff</h2>
          {["startseite", "erste-schritte", "it/dokumentation", "prozesse", "richtlinien"].map((slug) => {
            const page = pages.find((item) => item.slug === slug);
            return page ? <Link className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold hover:bg-brand-soft hover:text-brand dark:bg-slate-800" key={slug} to={`/wiki/${slug}`}>{page.title}<ArrowRight className="h-4 w-4" /></Link> : null;
          })}
        </section>
      </div>
    </div>
  );
}
