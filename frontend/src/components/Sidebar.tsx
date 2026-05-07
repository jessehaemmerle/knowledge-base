import { ChevronRight, FileText, Folder, Home, LayoutDashboard, ListTree, Search, Settings, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api, type MenuItem } from "../lib/api";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/auth";

function TreeItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const active = typeof item.slug === "string" && location.pathname === `/wiki/${item.slug}`;
  const externalUrl = item.external_url ?? "#";
  const content = (
    <div className={cn("group flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800", active && "bg-brand-soft font-semibold text-brand dark:bg-brand/20 dark:text-teal-200")} style={{ paddingLeft: 8 + depth * 14 }}>
      {item.type === "folder" ? <Folder className="h-4 w-4 text-slate-400" /> : <FileText className="h-4 w-4 text-slate-400" />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {item.children?.length ? <ChevronRight className={cn("h-3.5 w-3.5 transition", open && "rotate-90")} /> : null}
    </div>
  );

  return (
    <div>
      {item.type === "folder" ? <button className="w-full text-left" onClick={() => setOpen(!open)}>{content}</button> : item.type === "external" ? <a href={externalUrl} target="_blank" rel="noreferrer">{content}</a> : item.slug ? <Link to={`/wiki/${item.slug}`}>{content}</Link> : content}
      {open && item.children?.map((child) => <TreeItem key={child.id} item={child} depth={depth + 1} />)}
    </div>
  );
}

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const user = useAuthStore((state) => state.user);
  useEffect(() => { api.menu().then((data) => setMenu(data.menu)).catch(() => setMenu([])); }, []);

  const nav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/pages", label: "Seiten", icon: FileText },
    { to: "/menu", label: "Menue", icon: ListTree },
    ...(user?.role === "admin" ? [{ to: "/users", label: "Benutzer", icon: Users }, { to: "/audit", label: "Audit", icon: ShieldCheck }] : []),
    { to: "/settings", label: "Einstellungen", icon: Settings }
  ];

  return (
    <aside className={cn("h-screen w-80 shrink-0 border-r border-slate-200/70 bg-white/95 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95", mobile ? "block" : "sticky top-0 hidden bg-white/80 dark:bg-slate-950/80 lg:block")}>
      <Link to="/" className="mb-5 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Home className="h-5 w-5" /></div>
        <div>
          <div className="font-extrabold tracking-tight">Modern Wiki</div>
          <div className="text-xs text-slate-500">Markdown, aber freundlich</div>
        </div>
      </Link>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4" />
        <span>Globale Suche</span>
      </div>
      <nav className="mb-5 grid gap-1">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => cn("flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800", isActive && "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white")}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Wiki</div>
      <div className="space-y-1 overflow-auto pb-8">
        {menu.map((item) => <TreeItem key={item.id} item={item} />)}
        {menu.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Noch keine Menuepunkte vorhanden.</div>}
      </div>
    </aside>
  );
}
