import DOMPurify from "dompurify";
import { Archive, Code2, Copy, Edit3, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { api, type PageMeta } from "../lib/api";
import { timeAgo } from "../lib/utils";
import { useAuthStore } from "../store/auth";

function fullSlug(params: Readonly<Record<string, string | undefined>>) {
  return [params.slug, params["*"]].filter(Boolean).join("/");
}

export function WikiPage() {
  const params = useParams();
  const slug = fullSlug(params);
  const [page, setPage] = useState<PageMeta | null>(null);
  const [html, setHtml] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    api.page(slug).then((data) => { setPage(data.page); setHtml(data.html); }).catch(() => setPage(null));
  }, [slug]);

  const headings = useMemo(() => Array.from(html.matchAll(/<h([12])>(.*?)<\/h[12]>/g)).map((match) => DOMPurify.sanitize(match[2], { ALLOWED_TAGS: [] })).slice(0, 8), [html]);
  const canEdit = user?.role === "admin" || user?.role === "editor";

  if (!page) return <div className="mx-auto max-w-4xl rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Seite wird geladen oder wurde nicht gefunden.</div>;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
      <article className="min-w-0 rounded-3xl border border-white/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link to="/">Dashboard</Link><span>/</span><span>{page.title}</span>
        </div>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{page.title}</h1>
            {page.description && <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{page.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">{page.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>)}</div>
          </div>
          {canEdit && <Link to={`/editor/${page.slug}`}><Button><Edit3 className="h-4 w-4" />Bearbeiten</Button></Link>}
        </div>
        {showMarkdown ? <pre className="overflow-auto rounded-2xl bg-slate-950 p-5 text-sm text-slate-50">{page.content}</pre> : <div className="prose-wiki max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}><Copy className="h-4 w-4" />Link kopieren</Button>
          <Button variant="secondary" onClick={() => setShowMarkdown(!showMarkdown)}><Code2 className="h-4 w-4" />Markdown</Button>
          {canEdit && <Button variant="secondary" onClick={() => navigate(`/editor/new?parent=${page.slug}`)}><Plus className="h-4 w-4" />Unterseite</Button>}
          {canEdit && <Button variant="danger" onClick={async () => { await api.deletePage(page.slug); navigate("/"); }}><Archive className="h-4 w-4" />Archivieren</Button>}
        </div>
      </article>
      <aside className="hidden xl:block">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 text-sm font-bold">Auf dieser Seite</div>
          <div className="space-y-2 text-sm text-slate-500">{headings.map((heading) => <div key={heading} className="truncate">{heading}</div>)}</div>
          <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">Zuletzt geaendert {timeAgo(page.updated_at)}</div>
        </div>
      </aside>
    </div>
  );
}
