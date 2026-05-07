import { MonitorCog } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";

export function SettingsPage() {
  const [appName, setAppName] = useState(localStorage.getItem("wiki-app-name") ?? "Modern Markdown Wiki");
  const [defaultView, setDefaultView] = useState(localStorage.getItem("wiki-default-view") ?? "dashboard");
  const save = () => {
    localStorage.setItem("wiki-app-name", appName);
    localStorage.setItem("wiki-default-view", defaultView);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <MonitorCog className="mb-4 h-8 w-8 text-brand" />
      <h1 className="text-3xl font-extrabold tracking-tight">Einstellungen</h1>
      <div className="mt-6 grid gap-4">
        <label className="block text-sm font-semibold">App-Name<input value={appName} onChange={(event) => setAppName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="block text-sm font-semibold">Standardansicht<select value={defaultView} onChange={(event) => setDefaultView(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950"><option value="dashboard">Dashboard</option><option value="pages">Seitenliste</option></select></label>
        <Button onClick={save}>Speichern</Button>
      </div>
    </div>
  );
}
