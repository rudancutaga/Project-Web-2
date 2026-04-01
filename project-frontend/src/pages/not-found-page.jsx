import { Button } from "@/components/ui/button";

export default function NotFoundPage({ onNavigate }) {
  return (
    <section className="w-full rounded-[30px] border border-amber-200/60 bg-white p-10 text-center shadow-[0_18px_50px_rgba(120,53,15,0.08)]">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Khong tim thay trang</h1>
      <p className="mt-3 text-sm text-slate-600">Browser route hien tai khong ton tai trong bo khung du an.</p>
      <Button className="mt-6 rounded-full bg-amber-900 hover:bg-amber-800" onClick={() => onNavigate("/")}>
        Ve trang chu
      </Button>
    </section>
  );
}
