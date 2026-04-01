import AdminSidebar from "@/components/layout/admin-sidebar";
import ThemeToggle from "@/components/layout/theme-toggle";
import { useCurrentPath, useNavigate } from "@/routes/browser-router";

export default function AdminLayout({ children }) {
  const currentPath = useCurrentPath();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_25%,#020617_100%)] px-4 py-6 text-slate-100 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_1fr]">
        <AdminSidebar currentPath={currentPath} onNavigate={navigate} />
        <main className="min-h-[80vh] rounded-[32px] border border-white/10 bg-white/6 p-4 backdrop-blur sm:p-6">
          {children}
        </main>
      </div>
      <ThemeToggle />
    </div>
  );
}
