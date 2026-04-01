import { Button } from "@/components/ui/button";

export default function UnauthorizedPage({ onNavigate }) {
  return (
    <section className="w-full rounded-[30px] border border-amber-200/60 bg-white p-10 text-center shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">403</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Ban khong co quyen truy cap</h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Route nay da duoc bao ve theo role trong cau truc moi cua du an.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button className="rounded-full bg-amber-900 hover:bg-amber-800" onClick={() => onNavigate("/")}>
          Ve trang chu
        </Button>
        <Button variant="outline" className="rounded-full border-amber-300" onClick={() => onNavigate("/games")}>
          Den danh sach game
        </Button>
      </div>
    </section>
  );
}
