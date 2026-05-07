import { Plus, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../components/Button";
import { api, type Role, type User } from "../lib/api";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const load = () => api.users().then((data) => setUsers(data.users));
  useEffect(() => { load(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    await api.createUser({ email, name, password, role });
    setEmail(""); setName(""); setPassword(""); setRole("viewer");
    load();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-5 text-3xl font-extrabold tracking-tight">Benutzerverwaltung</h1>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"><UserRound className="h-5 w-5 text-slate-500" /></div>
                <div><div className="font-bold">{user.name}</div><div className="text-sm text-slate-500">{user.email}</div></div>
              </div>
              <div className="flex gap-2">
                <select value={user.role} onChange={async (event) => { await api.updateUser(user.id, { role: event.target.value as Role }); load(); }} className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
                <Button variant={user.active ? "secondary" : "ghost"} onClick={async () => { await api.updateUser(user.id, { active: !user.active } as any); load(); }}>{user.active ? "Aktiv" : "Inaktiv"}</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-bold">Benutzer anlegen</h2>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
        <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Initialpasswort" className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
        <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mb-4 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
        <Button className="w-full"><Plus className="h-4 w-4" />Anlegen</Button>
      </form>
    </div>
  );
}
