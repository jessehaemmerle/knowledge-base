import { Edit3, FileText, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { api, type PageMeta } from "../lib/api";
import { timeAgo } from "../lib/utils";

export function PagesAdminPage() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const load = () => api.pages().then((data) => setPages(data.pages));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => pages.filter((page) => (status === "all" || page.status === status) && `${page.title} ${page.description} ${page.slug}`.toLowerCase().includes(query.toLowerCase())), [pages, query, status]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Seitenverwaltung</h1><p className="mt-1 text-slate-500">Alle Wiki-Seiten, Entwuerfe und Aktionen an einem Ort.</p></div>
        <Link to="/editor/new"><Button>Neue Seite</Button></Link>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Seiten suchen..." className="flex-1 bg-transparent text-sm outline-none" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="all">Alle Status</option><option value="draft">Entwurf</option><option value="published">Veroeffentlicht</option></select>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((page) => (
            <div key={page.slug} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <Link to={`/wiki/${page.slug}`} className="min-w-0">
                <div className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-slate-400" />{page.title}</div>
                <div className="mt-1 text-sm text-slate-500">{page.slug} · {timeAgo(page.updated_at)}</div>
              </Link>
              <div className="flex gap-2">
                <Link to={`/editor/${page.slug}`}><Button variant="secondary"><Edit3 className="h-4 w-4" />Bearbeiten</Button></Link>
                <Button variant="danger" onClick={async () => { await api.deletePage(page.slug); load(); }}><Trash2 className="h-4 w-4" />Archivieren</Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-14 text-center text-slate-500">Noch keine Seiten vorhanden. Erstelle deine erste Wiki-Seite.</div>}
        </div>
      </section>
    </div>
  );
}
