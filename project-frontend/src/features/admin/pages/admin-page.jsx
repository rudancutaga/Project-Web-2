import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Gamepad2,
  RefreshCcw,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAdminGame,
  getAdminGames,
  getAdminStats,
  getAdminUsers,
  updateAdminGame,
  updateAdminUser,
} from "@/services/admin-service";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const panelClassName =
  "rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/80";
const fieldClassName =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const sectionMetaMap = {
  statistics: {
    title: "Thong ke he thong",
    description: "Tong hop overview, top game va session gan day cho khu admin.",
  },
  users: {
    title: "Quan ly nguoi dung",
    description: "Tim kiem, doi role va trang thai hoat dong cho tai khoan.",
  },
  games: {
    title: "Quan ly game",
    description: "Cap nhat board size, enable/disable va tao game moi.",
  },
};

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hint}</p>
    </article>
  );
}

function SectionHeading({ icon, eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
      {label}
    </div>
  );
}

export default function AdminPage({ section = "statistics" }) {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState({ stats: false, users: false, games: false });
  const [errors, setErrors] = useState({ stats: "", users: "", games: "" });
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [userFilters, setUserFilters] = useState({ q: "", role: "all", status: "all" });
  const [gameFilters, setGameFilters] = useState({ q: "", status: "all" });
  const [userDrafts, setUserDrafts] = useState({});
  const [gameDrafts, setGameDrafts] = useState({});
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyGameId, setBusyGameId] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [createGameForm, setCreateGameForm] = useState({
    code: "",
    name: "",
    description: "",
    board_size: "3",
    enabled: true,
  });

  const deferredUserQuery = useDeferredValue(userFilters.q);
  const deferredGameQuery = useDeferredValue(gameFilters.q);
  const activeSection = sectionMetaMap[section] || sectionMetaMap.statistics;

  useEffect(() => {
    const target = document.getElementById(`admin-${section}`);
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [section]);

  const loadStats = useCallback(async () => {
    setLoading((current) => ({ ...current, stats: true }));
    setErrors((current) => ({ ...current, stats: "" }));

    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      setErrors((current) => ({ ...current, stats: error.message }));
    } finally {
      setLoading((current) => ({ ...current, stats: false }));
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading((current) => ({ ...current, users: true }));
    setErrors((current) => ({ ...current, users: "" }));

    try {
      const data = await getAdminUsers({
        q: deferredUserQuery,
        role: userFilters.role,
        status: userFilters.status,
      });
      const nextUsers = data.users || [];
      setUsers(nextUsers);
      setUserDrafts(
        Object.fromEntries(
          nextUsers.map((entry) => [
            entry.id,
            {
              name: entry.name || "",
              display_name: entry.display_name || "",
              role: entry.role || "client",
              is_active: entry.is_active !== false,
            },
          ]),
        ),
      );
    } catch (error) {
      setErrors((current) => ({ ...current, users: error.message }));
    } finally {
      setLoading((current) => ({ ...current, users: false }));
    }
  }, [deferredUserQuery, userFilters.role, userFilters.status]);

  const loadGames = useCallback(async () => {
    setLoading((current) => ({ ...current, games: true }));
    setErrors((current) => ({ ...current, games: "" }));

    try {
      const data = await getAdminGames({
        q: deferredGameQuery,
        status: gameFilters.status,
      });
      const nextGames = data.games || [];
      setGames(nextGames);
      setGameDrafts(
        Object.fromEntries(
          nextGames.map((entry) => [
            entry.id,
            {
              code: entry.code || "",
              name: entry.name || "",
              description: entry.description || "",
              board_size: String(entry.board_size || 3),
              enabled: entry.enabled === true,
            },
          ]),
        ),
      );
    } catch (error) {
      setErrors((current) => ({ ...current, games: error.message }));
    } finally {
      setLoading((current) => ({ ...current, games: false }));
    }
  }, [deferredGameQuery, gameFilters.status]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  async function handleRefreshAll() {
    setNotice({ type: "", text: "" });

    try {
      await Promise.all([loadStats(), loadUsers(), loadGames()]);
      setNotice({ type: "success", text: "Du lieu admin da duoc lam moi." });
    } catch {
      setNotice({ type: "error", text: "Khong the lam moi dashboard." });
    }
  }

  async function handleSaveUser(userId) {
    const draft = userDrafts[userId];

    if (!draft) {
      return;
    }

    try {
      setBusyUserId(userId);
      setNotice({ type: "", text: "" });
      await updateAdminUser(userId, {
        name: draft.name.trim(),
        display_name: draft.display_name.trim() || null,
        role: draft.role,
        is_active: draft.is_active,
      });
      await Promise.all([loadUsers(), loadStats()]);
      setNotice({ type: "success", text: "Da cap nhat nguoi dung." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleSaveGame(gameId) {
    const draft = gameDrafts[gameId];

    if (!draft) {
      return;
    }

    try {
      setBusyGameId(gameId);
      setNotice({ type: "", text: "" });
      await updateAdminGame(gameId, {
        code: draft.code.trim(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        board_size: Number(draft.board_size),
        enabled: draft.enabled,
      });
      await Promise.all([loadGames(), loadStats()]);
      setNotice({ type: "success", text: "Da cap nhat game." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setBusyGameId(null);
    }
  }

  async function handleCreateGame(event) {
    event.preventDefault();

    try {
      setIsCreatingGame(true);
      setNotice({ type: "", text: "" });
      await createAdminGame({
        code: createGameForm.code.trim(),
        name: createGameForm.name.trim(),
        description: createGameForm.description.trim(),
        board_size: Number(createGameForm.board_size),
        enabled: createGameForm.enabled,
      });
      setCreateGameForm({
        code: "",
        name: "",
        description: "",
        board_size: "3",
        enabled: true,
      });
      await Promise.all([loadGames(), loadStats()]);
      setNotice({ type: "success", text: "Da tao game moi." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setIsCreatingGame(false);
    }
  }

  const overview = stats?.overview || {};
  const recentSessions = stats?.recent_sessions || [];
  const sessionBreakdown = stats?.session_breakdown || [];

  const topGameSummary = useMemo(() => {
    const topGames = stats?.top_games || [];
    return topGames
      .slice(0, 3)
      .map((item) => `${item.name || item.game_name}: ${formatNumber(item.play_count || item.total_sessions)}`);
  }, [stats?.top_games]);

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_55%,#facc15_135%)] p-8 text-white shadow-[0_20px_60px_rgba(8,47,73,0.24)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/85">Admin routes</p>
            <h1 className="text-4xl font-semibold">{activeSection.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-sky-50/85">{activeSection.description}</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-4 py-2 text-sm text-sky-50/90">
              <ShieldCheck className="size-4" />
              {user?.display_name || user?.name || "Admin"} dang quan tri he thong
            </div>
          </div>
          <Button
            type="button"
            className="rounded-full bg-white text-slate-900 hover:bg-sky-50"
            onClick={handleRefreshAll}
          >
            <RefreshCcw className="size-4" />
            Lam moi toan bo
          </Button>
        </div>
      </div>

      {notice.text ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            notice.type === "error"
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <section id="admin-statistics" className={panelClassName}>
        <SectionHeading
          icon={<BarChart3 className="size-5" />}
          eyebrow="Statistics"
          title="Tong quan he thong"
          description="Tach rieng khu thong ke cho route `/admin/statistics` theo yeu cau tai lieu."
        />

        {errors.stats ? <div className="mt-5 text-sm text-rose-600">{errors.stats}</div> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <MetricCard label="Nguoi dung" value={formatNumber(overview.total_users)} hint="Tong tai khoan trong he thong" />
          <MetricCard label="Games" value={formatNumber(overview.total_games)} hint="Tong so game dang duoc quan ly" />
          <MetricCard label="Hom nay" value={formatNumber(overview.today_sessions)} hint="Luot choi trong ngay" />
          <MetricCard
            label="Dang hoat dong"
            value={formatNumber(overview.active_sessions)}
            hint="Session dang duoc ghi nhan"
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top games</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {loading.stats ? <p>Dang tai thong ke game...</p> : null}
              {!loading.stats && topGameSummary.length === 0 ? <p>Chua co du lieu.</p> : null}
              {topGameSummary.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session breakdown</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {sessionBreakdown.length === 0 ? <p>Chua co phan bo session.</p> : null}
              {sessionBreakdown.slice(0, 4).map((item, index) => (
                <div key={`${item.status}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{item.status || "unknown"}</div>
                  <div className="mt-1">{formatNumber(item.total || item.count)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent sessions</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {recentSessions.length === 0 ? <p>Chua co session gan day.</p> : null}
              {recentSessions.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {item.game_name || item.game_code || `Session #${item.id}`}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                    {item.status || "unknown"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="admin-users" className={panelClassName}>
        <SectionHeading
          icon={<Users className="size-5" />}
          eyebrow="Users"
          title="Quan ly nguoi dung"
          description="Filter theo ten, role va trang thai, sau do cap nhat truoc tiep ngay tren dashboard."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Input
            value={userFilters.q}
            onChange={(event) => setUserFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Tim theo ten hoac email..."
          />
          <select
            value={userFilters.role}
            onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value }))}
            className={fieldClassName}
          >
            <option value="all">Tat ca role</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={userFilters.status}
            onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value }))}
            className={fieldClassName}
          >
            <option value="all">Tat ca trang thai</option>
            <option value="active">Dang hoat dong</option>
            <option value="inactive">Da khoa</option>
          </select>
        </div>

        {errors.users ? <div className="mt-5 text-sm text-rose-600">{errors.users}</div> : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {loading.users ? <EmptyState label="Dang tai danh sach nguoi dung..." /> : null}
          {!loading.users && users.length === 0 ? <EmptyState label="Khong co nguoi dung phu hop." /> : null}
          {!loading.users &&
            users.map((entry) => {
              const draft = userDrafts[entry.id];
              if (!draft) return null;

              return (
                <article key={entry.id} className="rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {entry.display_name || entry.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{entry.email}</p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                      #{entry.id}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Input
                      value={draft.name}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...current[entry.id], name: event.target.value },
                        }))
                      }
                      placeholder="Name"
                    />
                    <Input
                      value={draft.display_name}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...current[entry.id], display_name: event.target.value },
                        }))
                      }
                      placeholder="Display name"
                    />
                    <select
                      value={draft.role}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...current[entry.id], role: event.target.value },
                        }))
                      }
                      className={fieldClassName}
                    >
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...current[entry.id], is_active: event.target.checked },
                          }))
                        }
                      />
                      Tai khoan dang hoat dong
                    </label>
                  </div>

                  <Button
                    type="button"
                    className="mt-5 rounded-full bg-sky-800 hover:bg-sky-700"
                    onClick={() => handleSaveUser(entry.id)}
                    disabled={busyUserId === entry.id}
                  >
                    <Save className="size-4" />
                    {busyUserId === entry.id ? "Dang luu..." : "Luu nguoi dung"}
                  </Button>
                </article>
              );
            })}
        </div>
      </section>

      <section id="admin-games" className={panelClassName}>
        <SectionHeading
          icon={<Gamepad2 className="size-5" />}
          eyebrow="Games"
          title="Quan ly game"
          description="Theo tai lieu, admin co the enable/disable game, doi board size va tao game moi."
        />

        <form className="mt-6 grid gap-4 rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70" onSubmit={handleCreateGame}>
          <div className="grid gap-4 xl:grid-cols-4">
            <Input
              value={createGameForm.code}
              onChange={(event) => setCreateGameForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Code"
            />
            <Input
              value={createGameForm.name}
              onChange={(event) => setCreateGameForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ten game"
            />
            <Input
              value={createGameForm.board_size}
              onChange={(event) => setCreateGameForm((current) => ({ ...current, board_size: event.target.value }))}
              placeholder="Board size"
            />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={createGameForm.enabled}
                onChange={(event) => setCreateGameForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Bat game ngay
            </label>
          </div>
          <textarea
            value={createGameForm.description}
            onChange={(event) => setCreateGameForm((current) => ({ ...current, description: event.target.value }))}
            className={textareaClassName}
            placeholder="Mo ta game..."
          />
          <Button type="submit" className="w-fit rounded-full bg-emerald-700 hover:bg-emerald-600" disabled={isCreatingGame}>
            {isCreatingGame ? "Dang tao..." : "Tao game moi"}
          </Button>
        </form>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Input
            value={gameFilters.q}
            onChange={(event) => setGameFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Tim theo ma hoac ten game..."
          />
          <select
            value={gameFilters.status}
            onChange={(event) => setGameFilters((current) => ({ ...current, status: event.target.value }))}
            className={fieldClassName}
          >
            <option value="all">Tat ca trang thai</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {errors.games ? <div className="mt-5 text-sm text-rose-600">{errors.games}</div> : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {loading.games ? <EmptyState label="Dang tai danh sach game..." /> : null}
          {!loading.games && games.length === 0 ? <EmptyState label="Khong co game phu hop." /> : null}
          {!loading.games &&
            games.map((entry) => {
              const draft = gameDrafts[entry.id];
              if (!draft) return null;

              return (
                <article key={entry.id} className="rounded-[24px] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{entry.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{entry.code}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}>
                      {draft.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={draft.code}
                        onChange={(event) =>
                          setGameDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...current[entry.id], code: event.target.value },
                          }))
                        }
                        placeholder="Code"
                      />
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setGameDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...current[entry.id], name: event.target.value },
                          }))
                        }
                        placeholder="Ten game"
                      />
                    </div>

                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setGameDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...current[entry.id], description: event.target.value },
                        }))
                      }
                      className={textareaClassName}
                      placeholder="Mo ta game"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={draft.board_size}
                        onChange={(event) =>
                          setGameDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...current[entry.id], board_size: event.target.value },
                          }))
                        }
                        placeholder="Board size"
                      />
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            setGameDrafts((current) => ({
                              ...current,
                              [entry.id]: { ...current[entry.id], enabled: event.target.checked },
                            }))
                          }
                        />
                        Game duoc bat
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-5 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-sky-200 dark:text-slate-900 dark:hover:bg-sky-100"
                    onClick={() => handleSaveGame(entry.id)}
                    disabled={busyGameId === entry.id}
                  >
                    <Save className="size-4" />
                    {busyGameId === entry.id ? "Dang luu..." : "Luu game"}
                  </Button>
                </article>
              );
            })}
        </div>
      </section>
    </section>
  );
}
