import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Home, Search, Trophy, MessageCircle, Shield, Users, BarChart3 } from "lucide-react";

const navItems = [
  { label: "Games", path: "/games", icon: Trophy },
  { label: "Friends", path: "/friends", icon: Users },
  { label: "Messages", path: "/messages", icon: MessageCircle },
  { label: "Rankings", path: "/rankings", icon: BarChart3 },
  { label: "Admin", path: "/admin/statistics", icon: Shield, adminOnly: true },
];

export default function Navbar({ currentPath, onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();

  const handleLogout = async () => {
    await logout();
    onNavigate("/");
  };

  const initials = (user?.display_name || user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <div className="mt-4">
      <nav className="rounded-[28px] border border-amber-200/60 bg-white/85 shadow-[0_24px_80px_rgba(120,53,15,0.12)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onNavigate("/")}
              variant="ghost"
              className="rounded-full border border-amber-200 bg-amber-50 px-4 text-amber-900 hover:bg-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-100 dark:hover:bg-slate-700"
            >
              <Home className="size-4" />
              {user?.role === "admin" ? "BoardVerse Admin" : "BoardVerse"}
            </Button>

            <div className="hidden items-center gap-2 lg:flex">
              {visibleItems.map((item) => {
                const active = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
                const ItemIcon = item.icon;
                return (
                  <Button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    variant="ghost"
                    className={active
                      ? "rounded-full bg-amber-900 text-amber-50 hover:bg-amber-800 dark:bg-amber-200 dark:text-slate-900 dark:hover:bg-amber-100"
                      : "rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-100"
                    }
                  >
                    <ItemIcon className="size-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Input
                type="search"
                placeholder="Tim ban, game, xep hang..."
                className="border-amber-200 bg-amber-50/60 md:w-72 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
              <Button variant="outline" size="icon" className="border-amber-300 text-amber-800 dark:border-slate-700 dark:text-amber-100">
                <Search className="size-5" />
              </Button>
            </div>

            {!isAuthenticated ? (
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full border-amber-300 dark:border-slate-700" onClick={() => onNavigate("/login")}>
                  Login
                </Button>
                <Button className="rounded-full bg-amber-900 text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-slate-900 dark:hover:bg-amber-100" onClick={() => onNavigate("/register")}>
                  Sign up
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-amber-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-800">
                    <Avatar className="size-8">
                      <AvatarImage src={user?.avatar_url || user?.avatarUrl} alt={user?.display_name || user?.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 hidden text-sm font-medium sm:inline">
                      {user?.display_name || user?.name}
                    </span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${user?.role === "admin" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"}`}>
                      {user?.role || "client"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{user?.display_name || user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("/games")}>Games</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("/friends")}>Friends</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("/rankings")}>Rankings</DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => onNavigate("/admin/statistics")}>Admin dashboard</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>
      <div className="mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">
        {isDark ? "Dark theme active" : "Light theme active"}
      </div>
    </div>
  );
}
