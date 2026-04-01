import { Trophy, ShieldCheck, Users, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Board games hub",
    description: "Tap hop mini game co ranking, save/load va rating ngay tren mot SPA.",
    icon: Trophy,
  },
  {
    title: "Client + Admin",
    description: "Phan role ro rang de nguoi choi va quan tri van hanh chung mot he thong.",
    icon: ShieldCheck,
  },
  {
    title: "Social layer",
    description: "Ket ban, nhan tin, theo doi thanh tich va bang xep hang ban be.",
    icon: Users,
  },
  {
    title: "Feedback loop",
    description: "Nguoi dung co the danh gia game va de lai comment de cai thien san pham.",
    icon: MessageCircleMore,
  },
];

export default function HomePage({ onNavigate }) {
  return (
    <section className="w-full space-y-8">
      <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#451a03_0%,#9a3412_45%,#f59e0b_100%)] p-8 text-white shadow-[0_30px_90px_rgba(146,64,14,0.35)] lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">Web project studio</p>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight lg:text-6xl">
              Xay dung mot trung tam board game co auth, social, admin va API rieng.
            </h1>
            <p className="max-w-2xl text-base text-amber-50/85 lg:text-lg">
              Day la bo khung de ban tiep tuc lam do an: frontend SPA, backend REST, sessions, ranking va giao dien admin.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-white text-amber-900 hover:bg-amber-50" onClick={() => onNavigate("/games")}>
                Kham pha games
              </Button>
              <Button variant="outline" className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20" onClick={() => onNavigate("/register")}>
                Tao tai khoan demo
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-white/20 bg-black/10 p-4 backdrop-blur-sm">
            <div className="rounded-2xl bg-white/12 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/70">Milestone</p>
              <p className="mt-2 text-2xl font-semibold">3 games mau</p>
              <p className="mt-2 text-sm text-amber-50/80">Tic Tac Toe, Caro 5, Connect 4</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/12 p-4">
                <p className="text-3xl font-semibold">REST</p>
                <p className="mt-1 text-sm text-amber-50/80">Express + Knex</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <p className="text-3xl font-semibold">SPA</p>
                <p className="mt-1 text-sm text-amber-50/80">Browser routes ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => {
          const ItemIcon = item.icon;
          return (
            <article key={item.title} className="rounded-[28px] border border-amber-200/60 bg-white/90 p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                <ItemIcon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
