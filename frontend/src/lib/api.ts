import { useAuthStore } from "../store/auth";

const API_BASE = "/api";

export type Role = "admin" | "editor" | "viewer";
export type User = { id: number; email: string; name: string; role: Role; active: number };
export type PageMeta = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  status: "draft" | "published" | "archived";
  visibility: string;
  tags: string[];
  content?: string;
  updated_at: string;
  created_at: string;
};
export type MenuItem = {
  id: number;
  parent_id: number | null;
  page_id?: number | null;
  type: "folder" | "page" | "external";
  title: string;
  slug?: string | null;
  external_url?: string | null;
  icon?: string | null;
  children: MenuItem[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unbekannter Fehler" }));
    throw new Error(error.message ?? "Anfrage fehlgeschlagen");
  }
  return response.json();
}

export const api = {
  login: (email: string, password: string) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<{ user: User }>("/auth/me"),
  menu: () => request<{ menu: MenuItem[] }>("/menu"),
  pages: () => request<{ pages: PageMeta[] }>("/pages"),
  page: (slug: string) => request<{ page: PageMeta; html: string }>(`/pages/${slug}`),
  createPage: (page: Partial<PageMeta> & { content: string; changeNote?: string }) => request<{ slug: string }>("/pages", { method: "POST", body: JSON.stringify(page) }),
  updatePage: (slug: string, page: Partial<PageMeta> & { content?: string; changeNote?: string }) => request<{ slug: string }>(`/pages/${slug}`, { method: "PATCH", body: JSON.stringify(page) }),
  deletePage: (slug: string) => request<{ ok: true }>(`/pages/${slug}`, { method: "DELETE" }),
  search: (q: string) => request<{ results: Array<PageMeta & { snippet: string }> }>(`/search?q=${encodeURIComponent(q)}`),
  users: () => request<{ users: User[] }>("/users"),
  createUser: (user: Partial<User> & { password: string }) => request<{ id: number }>("/users", { method: "POST", body: JSON.stringify(user) }),
  updateUser: (id: number, user: Partial<User> & { password?: string }) => request<{ ok: true }>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(user) }),
  audit: () => request<{ entries: any[] }>("/audit"),
  addMenuItem: (item: Partial<MenuItem> & { page_id?: number | null; sort_order?: number }) => request<{ id: number }>("/menu", { method: "POST", body: JSON.stringify(item) })
};
