import Footer from "@/components/layout/footer";
import MainShell from "@/components/layout/main-shell";
import Navbar from "@/components/layout/navbar";
import ThemeToggle from "@/components/layout/theme-toggle";
import { useCurrentPath, useNavigate } from "@/routes/browser-router";

export default function ClientLayout({ children }) {
  const currentPath = useCurrentPath();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fde68a_0%,#fff7ed_22%,#fffdf8_58%,#f8fafc_100%)] px-4 py-6 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_35%,#020617_100%)] dark:text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Navbar currentPath={currentPath} onNavigate={navigate} />
        <MainShell>{children}</MainShell>
        <Footer companyName="BoardVerse Studio" year={new Date().getFullYear()} />
      </div>
      <ThemeToggle />
    </div>
  );
}
