import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/context/theme-context";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-amber-300 bg-white/90 px-4 py-3 text-sm font-medium text-amber-900 shadow-[0_18px_50px_rgba(120,53,15,0.18)] backdrop-blur transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900/90 dark:text-amber-100"
    >
      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
