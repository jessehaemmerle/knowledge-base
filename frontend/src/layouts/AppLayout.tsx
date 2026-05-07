import { LogOut, Menu, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { CommandPalette } from "../components/CommandPalette";
import { Sidebar } from "../components/Sidebar";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export function AppLayout() {
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) api.me().then(({ user }) => setAuth(token, user)).catch(() => logout());
  }, [token, setAuth, logout]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-slate-50/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden" onClick={() => setMobileNav(true)}><Menu className="h-5 w-5" /></Button>
            <div className="text-sm text-slate-500">Angemeldet als <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/editor/new"><Button><Plus className="h-4 w-4" />Neue Seite</Button></Link>
            <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setDark(!dark)} aria-label="Theme wechseln">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => { logout(); navigate("/login"); }} aria-label="Logout"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      {mobileNav && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}
      <CommandPalette />
    </div>
  );
}
