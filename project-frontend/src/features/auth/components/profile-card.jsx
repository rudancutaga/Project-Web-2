import { useEffect, useMemo, useState } from "react";
import { Award, PencilLine, Save, Trophy } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserProgress } from "@/services/user-service";
import {
  getLocalGames,
  getLocalProfile,
  getLocalProgressSummary,
  saveLocalProfile,
} from "@/features/games/local-data";

export default function ProfileCard({ onLoggedOut }) {
  const { user, logout, updateProfile } = useAuth();
  const [profile, setProfile] = useState(() => {
    const localProfile = getLocalProfile();
    return {
      ...localProfile,
      display_name: user?.display_name ?? localProfile.display_name,
      bio: user?.bio ?? localProfile.bio,
    };
  });
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const games = useMemo(() => getLocalGames(), []);
  const [progress, setProgress] = useState(() => getLocalProgressSummary());
  const [progressNotice, setProgressNotice] = useState("");

  useEffect(() => {
    const localProfile = getLocalProfile();
    setProfile({
      ...localProfile,
      display_name: user?.display_name ?? localProfile.display_name,
      bio: user?.bio ?? localProfile.bio,
    });
  }, [user?.bio, user?.display_name]);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const data = await getCurrentUserProgress();
        if (cancelled) {
          return;
        }

        setProgress(data.progress || getLocalProgressSummary());
        setProgressNotice("Tien do dang duoc dong bo tu backend.");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setProgress(getLocalProgressSummary());
        setProgressNotice(`Dang hien thi tien do local. Backend load that bai: ${error.message}`);
      }
    }

    if (user) {
      loadProgress();
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await logout();
    onLoggedOut?.();
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    saveLocalProfile(profile);
    setNotice("");
    setIsSaving(true);

    try {
      await updateProfile({
        display_name: profile.display_name.trim() ? profile.display_name.trim() : null,
        bio: profile.bio.trim() ? profile.bio.trim() : null,
      });
      setNotice("Da luu profile backend va dong bo profile local.");
    } catch (error) {
      setNotice(`Da luu profile local. Backend cap nhat that bai: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid w-full gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[30px] border-amber-200/60 shadow-[0_18px_50px_rgba(120,53,15,0.08)]">
        <CardHeader>
          <CardTitle>Profile va tuy bien local</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-5 text-sm text-slate-700">
            <div className="rounded-3xl bg-amber-50 p-5 dark:bg-slate-800/70">
              <div><strong>Ten dang nhap:</strong> {user.display_name || user.name}</div>
              <div className="mt-2"><strong>Email:</strong> {user.email}</div>
              <div className="mt-2"><strong>Role:</strong> {user.role || "client"}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 font-medium">
                  <PencilLine className="size-4" />
                  Display name
                </label>
                <Input
                  value={profile.display_name}
                  onChange={(event) => setProfile((current) => ({ ...current, display_name: event.target.value }))}
                  placeholder="Dat ten hien thi cho profile local"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                  className="min-h-28 w-full rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Mo ta ngan ve phong cach choi cua ban..."
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Favorite game</label>
                <select
                  value={profile.favorite_game}
                  onChange={(event) => setProfile((current) => ({ ...current, favorite_game: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {notice ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                {notice}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-amber-900 text-white hover:bg-amber-800"
              disabled={isSaving}
            >
              <Save className="size-4" />
              {isSaving ? "Dang luu..." : "Luu profile"}
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[30px] border-amber-200/60 shadow-[0_18px_50px_rgba(120,53,15,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-700" />
              Thong ke ca nhan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {progressNotice ? (
              <div className="sm:col-span-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-700 dark:bg-sky-950/30 dark:text-sky-200">
                {progressNotice}
              </div>
            ) : null}
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total sessions</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{progress.total_sessions}</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Finished</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{progress.finished_sessions}</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Saved slots</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{progress.saved_sessions}</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">High score</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{progress.high_score}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-amber-200/60 shadow-[0_18px_50px_rgba(120,53,15,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-amber-700" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-2xl border p-4 ${
                  achievement.unlocked
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                }`}
              >
                <div className="font-semibold">{achievement.title}</div>
                <div className="mt-1 text-sm">{achievement.description}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em]">
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
