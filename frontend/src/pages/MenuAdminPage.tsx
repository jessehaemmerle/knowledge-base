import { FolderPlus, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../components/Button";
import { api, type MenuItem, type PageMeta } from "../lib/api";

export function MenuAdminPage() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"folder" | "page" | "external">("folder");
  const [pageId, setPageId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const loadMenu = () => api.menu().then((data) => setMenu(data.menu));
  useEffect(() => { api.pages().then((data) => setPages(data.pages)); loadMenu(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.addMenuItem({ title, type, page_id: type === "page" ? Number(pageId) : null, external_url: type === "external" ? externalUrl : null });
    setTitle(""); setPageId(""); setExternalUrl("");
    loadMenu();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6"><h1 className="text-3xl font-extrabold tracking-tight">Menueverwaltung</h1><p className="mt-1 text-slate-500">Strukturiere die linke Navigation fuer dein Team.</p></div>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_160px]">
          <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" className="h-11 rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
          <select value={type} onChange={(event) => setType(event.target.value as any)} className="h-11 rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950"><option value="folder">Ordner</option><option value="page">Seite</option><option value="external">Externer Link</option></select>
          {type === "page" && <select required value={pageId} onChange={(event) => setPageId(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 md:col-span-2 dark:border-slate-700 dark:bg-slate-950"><option value="">Seite waehlen</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}</select>}
          {type === "external" && <input required value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." className="h-11 rounded-xl border border-slate-200 px-3 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" />}
          <Button className="md:col-span-2"><Plus className="h-4 w-4" />Menuepunkt hinzufuegen</Button>
        </form>
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-5 text-slate-500 dark:border-slate-700">
          <FolderPlus className="mx-auto mb-3 h-8 w-8" />
          <div className="space-y-2">
            {menu.map((item) => <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold dark:bg-slate-800">{item.title}</div>)}
            {menu.length === 0 && <div className="text-center text-sm">Dieser Bereich ist noch leer.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
