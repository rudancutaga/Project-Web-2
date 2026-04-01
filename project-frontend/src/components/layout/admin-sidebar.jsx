import { BarChart3, Gamepad2, Home, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { label: "Statistics", path: "/admin/statistics", icon: BarChart3 },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Games", path: "/admin/games", icon: Gamepad2 },
];

export default function AdminSidebar({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    onNavigate("/");
  }

  return (
    <aside className="rounded-[32px] border border-slate-800/70 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-5 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.42)]">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">Admin interface</p>
        <h1 className="mt-3 text-2xl font-semibold">BoardVerse Console</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Tach rieng dashboard quan tri theo dung yeu cau tai lieu frontend.
        </p>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.display_name || user?.name || "Admin"}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user?.role || "admin"}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {adminNavItems.map((item) => {
          const ItemIcon = item.icon;
          const active = currentPath === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-sky-400 text-slate-950"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <ItemIcon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="justify-start rounded-2xl border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={() => onNavigate("/games")}
        >
          <Home className="size-4" />
          Ve khu client
        </Button>
        <Button
          type="button"
          variant="outline"
          className="justify-start rounded-2xl border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={handleLogout}
        >
          Dang xuat
        </Button>
      </div>
    </aside>
  );
}
