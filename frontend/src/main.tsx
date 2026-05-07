import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@toast-ui/editor/dist/toastui-editor.css";
import "./styles/globals.css";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WikiPage } from "./pages/WikiPage";
import { EditorPage } from "./pages/EditorPage";
import { PagesAdminPage } from "./pages/PagesAdminPage";
import { UsersPage } from "./pages/UsersPage";
import { AuditPage } from "./pages/AuditPage";
import { MenuAdminPage } from "./pages/MenuAdminPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuthStore } from "./store/auth";

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="wiki/:slug/*" element={<WikiPage />} />
          <Route path="editor/new" element={<EditorPage />} />
          <Route path="editor/:slug/*" element={<EditorPage />} />
          <Route path="pages" element={<PagesAdminPage />} />
          <Route path="menu" element={<MenuAdminPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
