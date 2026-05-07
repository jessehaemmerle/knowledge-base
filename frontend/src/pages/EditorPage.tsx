import { Editor } from "@toast-ui/react-editor";
import { Loader2, Save, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { api, type PageMeta } from "../lib/api";
import { slugifyPath, timeAgo } from "../lib/utils";

function fullSlug(params: Readonly<Record<string, string | undefined>>) {
  return [params.slug, params["*"]].filter(Boolean).join("/");
}

export function EditorPage() {
  const params = useParams();
  const slug = fullSlug(params);
  const isNew = !params.slug;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editorRef = useRef<Editor>(null);
  const [title, setTitle] = useState("");
  const [pageSlug, setPageSlug] = useState(searchParams.get("parent") ? `${searchParams.get("parent")}/neue-seite` : "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string>();
  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState<PageMeta[]>([]);

  useEffect(() => {
    if (isNew) return;
    api.page(slug).then(({ page }) => {
      setTitle(page.title);
      setPageSlug(page.slug);
      setDescription(page.description ?? "");
      setTags(page.tags.join(", "));
      setStatus(page.status);
      setInitial(page.content ?? "");
      setSavedAt(page.updated_at);
    }).finally(() => setLoading(false));
  }, [isNew, slug]);

  useEffect(() => {
    if (!linkQuery.trim()) return setLinkResults([]);
    const timeout = window.setTimeout(() => api.search(linkQuery).then((data) => setLinkResults(data.results)).catch(() => setLinkResults([])), 150);
    return () => window.clearTimeout(timeout);
  }, [linkQuery]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty || isNew) return;
    const timeout = window.setTimeout(() => save("draft", true), 6000);
    return () => window.clearTimeout(timeout);
  }, [dirty]);

  const content = () => editorRef.current?.getInstance().getMarkdown() ?? initial;
  const normalizedTags = useMemo(() => tags.split(",").map((tag) => tag.trim()).filter(Boolean), [tags]);

  async function save(nextStatus = status, autosave = false) {
    setSaving(true);
    try {
      const payload = { title, slug: pageSlug, description, status: nextStatus as any, visibility: "authenticated", tags: normalizedTags, content: content(), changeNote: autosave ? "Autosave" : "Manuell gespeichert" };
      const result = isNew ? await api.createPage(payload) : await api.updatePage(slug, payload);
      setDirty(false);
      setSavedAt(new Date().toISOString());
      if (!autosave) navigate(`/wiki/${result.slug}`);
    } finally {
      setSaving(false);
    }
  }

  function insertInternalLink(page: PageMeta) {
    const instance = editorRef.current?.getInstance();
    instance?.insertText(`[${page.title}](/wiki/${page.slug})`);
    setDirty(true);
    setLinkQuery("");
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Editor wird geladen...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand"><Sparkles className="h-4 w-4" />WYSIWYG Editor</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{isNew ? "Neue Wiki-Seite" : "Seite bearbeiten"}</h1>
          <p className="mt-1 text-sm text-slate-500">{dirty ? "Ungespeicherte Aenderungen" : savedAt ? `Zuletzt gespeichert ${timeAgo(savedAt)}` : "Noch nicht gespeichert"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Abbrechen</Button>
          <Button variant="secondary" disabled={saving || !title || !pageSlug} onClick={() => save("draft")}><Save className="h-4 w-4" />Speichern</Button>
          <Button disabled={saving || !title || !pageSlug} onClick={() => save("published")}><Send className="h-4 w-4" />Veroeffentlichen</Button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input value={title} onChange={(event) => { setTitle(event.target.value); if (isNew) setPageSlug(slugifyPath(event.target.value)); setDirty(true); }} placeholder="Seitentitel" className="h-12 rounded-xl border border-slate-200 px-3 text-lg font-bold outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
            <input value={pageSlug} onChange={(event) => { setPageSlug(slugifyPath(event.target.value)); setDirty(true); }} placeholder="slug/unterseite" className="h-12 rounded-xl border border-slate-200 px-3 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <Editor ref={editorRef} initialValue={initial || "# Neue Seite\n\nBeginne hier mit deinem Inhalt."} previewStyle="vertical" height="650px" initialEditType="wysiwyg" useCommandShortcut onChange={() => setDirty(true)} toolbarItems={[["heading", "bold", "italic", "strike"], ["hr", "quote"], ["ul", "ol", "task"], ["table", "link"], ["code", "codeblock"], ["scrollSync"]]} />
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-bold">Seiteneinstellungen</h2>
            <label className="mb-4 block text-sm font-semibold">Beschreibung<textarea value={description} onChange={(event) => { setDescription(event.target.value); setDirty(true); }} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" /></label>
            <label className="mb-4 block text-sm font-semibold">Tags<input value={tags} onChange={(event) => { setTags(event.target.value); setDirty(true); }} placeholder="it, prozess, sicherheit" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" /></label>
            <label className="block text-sm font-semibold">Status<select value={status} onChange={(event) => { setStatus(event.target.value as any); setDirty(true); }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950"><option value="draft">Entwurf</option><option value="published">Veroeffentlicht</option><option value="archived">Archiviert</option></select></label>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 font-bold">Interne Links</h2>
            <p className="mb-3 text-sm text-slate-500">Suche eine Seite und fuege direkt einen Wiki-Link ein.</p>
            <input value={linkQuery} onChange={(event) => setLinkQuery(event.target.value)} placeholder="z. B. Firewall" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
            <div className="mt-3 space-y-2">
              {linkResults.map((page) => <button key={page.slug} onClick={() => insertInternalLink(page)} className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-semibold hover:bg-brand-soft hover:text-brand dark:bg-slate-800">{page.title}</button>)}
              {linkQuery && linkResults.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">Noch keine Seite gefunden. Speichere zuerst diese Seite oder erstelle eine neue.</div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
