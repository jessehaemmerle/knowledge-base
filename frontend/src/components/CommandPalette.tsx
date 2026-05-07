import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./Button";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const timeout = window.setTimeout(() => api.search(query).then((data) => setResults(data.results)).catch(() => setResults([])), 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Seite suchen oder Aktion ausfuehren..." className="h-10 flex-1 bg-transparent text-sm outline-none" />
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(false)} aria-label="Schliessen"><X className="h-4 w-4" /></Button>
        </div>
        <div className="max-h-96 overflow-auto p-2">
          <button onClick={() => { setOpen(false); navigate("/editor/new"); }} className="flex w-full items-center rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">Neue Seite erstellen</button>
          {results.map((result) => (
            <Link key={result.slug} to={`/wiki/${result.slug}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="font-semibold">{result.title}</div>
              <div className="line-clamp-1 text-sm text-slate-500">{result.snippet || result.description}</div>
            </Link>
          ))}
          {query && results.length === 0 && <div className="px-3 py-8 text-center text-sm text-slate-500">Keine Suchergebnisse gefunden.</div>}
        </div>
      </div>
    </div>
  );
}
