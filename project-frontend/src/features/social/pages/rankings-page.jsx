import { useEffect, useMemo, useState } from "react";
import PaginationControls from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { getGames } from "@/services/game-service";
import { getRankings } from "@/services/ranking-service";

const scopes = [
  { value: "global", label: "Toan he thong" },
  { value: "friends", label: "Ban be" },
  { value: "self", label: "Ca nhan" },
];

const PAGE_SIZE = 6;

function paginate(items, page, pageSize = PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function RankingsPage({ onNavigate }) {
  const [games, setGames] = useState([]);
  const [scope, setScope] = useState("global");
  const [gameId, setGameId] = useState("");
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function bootstrap() {
      try {
        setIsLoading(true);
        const [gamesData, rankingData] = await Promise.all([
          getGames(),
          getRankings({ scope: "global" }),
        ]);
        setGames(gamesData.games || []);
        setRankings(rankingData.rankings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadRankings() {
      try {
        setIsLoading(true);
        setError("");
        const rankingData = await getRankings({ scope, gameId });
        setRankings(rankingData.rankings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRankings();
  }, [scope, gameId]);

  useEffect(() => {
    setPage(1);
  }, [scope, gameId, rankings.length]);

  const pagedRankings = useMemo(() => paginate(rankings, page), [rankings, page]);
  const totalPages = Math.max(1, Math.ceil(rankings.length / PAGE_SIZE));

  return (
    <section className="w-full space-y-6">
        <div className="rounded-[30px] border border-sky-200/60 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_55%,#facc15_130%)] p-8 text-white shadow-[0_20px_60px_rgba(8,47,73,0.24)]">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-100">Rankings</p>
          <h1 className="mt-2 text-3xl font-semibold">Bang xep hang theo game, ban be va ca nhan</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-sky-50/85">
            Man nay giup ban dat tieu chi ranking co filter theo game va pham vi hien thi. Du lieu dang doc tu `/social/rankings`.
          </p>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-sky-200/60 bg-white p-5 shadow-sm md:grid-cols-[220px_1fr_auto] dark:border-slate-700 dark:bg-slate-900/80">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Pham vi</label>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {scopes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Game</label>
            <select
              value={gameId}
              onChange={(event) => setGameId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Tat ca game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>{game.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button className="rounded-full bg-sky-800 hover:bg-sky-700" onClick={() => onNavigate("/games")}>Qua danh sach game</Button>
          </div>
        </div>

        {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {isLoading ? <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm dark:bg-slate-900/80">Dang tai bang xep hang...</div> : null}

        {!isLoading ? (
          <div className="overflow-hidden rounded-[30px] border border-sky-200/60 bg-white shadow-[0_18px_50px_rgba(8,47,73,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
            <div className="grid grid-cols-[88px_1.5fr_1fr_120px_110px_110px_110px] gap-3 border-b border-sky-100 bg-sky-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-sky-900 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-100">
              <div>Top</div>
              <div>Nguoi choi</div>
              <div>Game</div>
              <div>Diem</div>
              <div>Wins</div>
              <div>Losses</div>
              <div>Draws</div>
            </div>
            <div>
              {rankings.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500">Chua co du lieu ranking cho bo loc hien tai.</div>
              ) : (
                pagedRankings.map((item, index) => {
                  const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <div key={item.id} className="grid grid-cols-[88px_1.5fr_1fr_120px_110px_110px_110px] gap-3 border-b border-slate-100 px-5 py-4 text-sm text-slate-700 last:border-b-0 dark:border-slate-800 dark:text-slate-200">
                      <div>
                        <span className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${rowNumber <= 3 ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                          #{rowNumber}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.display_name || item.email}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.email}</div>
                      </div>
                      <div>{item.game_name}</div>
                      <div className="font-semibold text-sky-800 dark:text-sky-300">{item.total_score}</div>
                      <div>{item.wins}</div>
                      <div>{item.losses}</div>
                      <div>{item.draws}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 py-4">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label="Bang xep hang"
              />
            </div>
          </div>
        ) : null}
    </section>
  );
}
