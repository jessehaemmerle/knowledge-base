import { BookOpen, Loader2, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export function LoginPage() {
  const [email, setEmail] = useState("admin@example.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email, password);
      setAuth(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ef,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] p-4 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="p-8 sm:p-12">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white"><BookOpen className="h-6 w-6" /></div>
              <div>
                <div className="text-xl font-extrabold">Modern Markdown Wiki</div>
                <div className="text-sm text-slate-500">Self-hosted Wissen, elegant verwaltet</div>
              </div>
            </div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">Ein Wiki, das sich so leicht anfuehlt wie ein gutes SaaS-Tool.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">Visuell schreiben, intern verlinken, sauber als Markdown sichern. Gebaut fuer Teams, die Dokumentation wirklich nutzen wollen.</p>
          </section>
          <section className="border-t border-slate-100 bg-slate-50/80 p-8 dark:border-slate-800 dark:bg-slate-950/40 sm:p-12 lg:border-l lg:border-t-0">
            <form onSubmit={submit} className="mx-auto max-w-sm">
              <div className="mb-8">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><Lock className="h-5 w-5" /></div>
                <h2 className="text-2xl font-bold">Anmelden</h2>
                <p className="mt-2 text-sm text-slate-500">Nutze den beim ersten Start erzeugten Admin-Benutzer.</p>
              </div>
              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-semibold">E-Mail</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-semibold">Passwort</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
              <Button className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}Einloggen</Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
