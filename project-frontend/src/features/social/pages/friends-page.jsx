import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/shared/pagination-controls";
import { acceptFriendRequest, getFriends, sendFriendRequest } from "@/services/friend-service";
import { getUsers } from "@/services/user-service";

const PAGE_SIZE = 4;

function paginate(items, page, pageSize = PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(items, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(items.length / pageSize));
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [friendsPage, setFriendsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [candidatesPage, setCandidatesPage] = useState(1);

  async function refreshFriendsData() {
    const [friendsData, usersData] = await Promise.all([
      getFriends(),
      getUsers(),
    ]);
    setFriends(friendsData.friends || []);
    setPendingRequests(friendsData.pendingRequests || []);
    setUsers(usersData.users || []);
  }

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        await refreshFriendsData();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const candidates = useMemo(() => {
    const currentId = user?.id;
    const connectedIds = new Set([
      ...friends.flatMap((item) => [item.requester_id, item.addressee_id]),
      ...pendingRequests.flatMap((item) => [item.requester_id, item.addressee_id]),
    ]);

    return users.filter((item) => {
      if (item.id === currentId) return false;
      if (connectedIds.has(item.id)) return false;
      if (!search.trim()) return true;

      return [item.name, item.display_name, item.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));
    });
  }, [friends, pendingRequests, search, user?.id, users]);

  useEffect(() => {
    setFriendsPage(1);
  }, [friends.length]);

  useEffect(() => {
    setPendingPage(1);
  }, [pendingRequests.length]);

  useEffect(() => {
    setCandidatesPage(1);
  }, [candidates.length, search]);

  const pagedFriends = useMemo(() => paginate(friends, friendsPage), [friends, friendsPage]);
  const pagedPending = useMemo(() => paginate(pendingRequests, pendingPage), [pendingRequests, pendingPage]);
  const pagedCandidates = useMemo(() => paginate(candidates, candidatesPage), [candidates, candidatesPage]);

  async function handleSendRequest(userId) {
    try {
      setBusyUserId(userId);
      setError("");
      await sendFriendRequest(userId);
      await refreshFriendsData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleAcceptRequest(userId) {
    try {
      setBusyUserId(userId);
      setError("");
      await acceptFriendRequest(userId);
      await refreshFriendsData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <section className="w-full space-y-6">
        <div className="rounded-[30px] border border-amber-200/60 bg-white p-8 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Friends</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Mang xa hoi nguoi choi</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Da noi API `/social/friends`, `/social/friends/:userId/request`, `/social/friends/:userId/accept` va `/users`. Ban co the tim user, gui request va chap nhan loi moi ngay tren giao dien.
          </p>
          <div className="mt-6 rounded-3xl bg-amber-50 p-6 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Tai khoan hien tai: <strong>{user?.display_name || user?.name}</strong>
          </div>
        </div>

        {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[30px] border border-amber-200/60 bg-white p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Ban be hien tai</h2>
            {isLoading ? <p className="mt-4 text-sm text-slate-500">Dang tai danh sach ban be...</p> : null}
            {!isLoading && friends.length === 0 ? <p className="mt-4 text-sm text-slate-500">Chua co ban be nao.</p> : null}
            <div className="mt-4 space-y-3">
              {pagedFriends.map((friend) => {
                const isRequester = friend.requester_id === user?.id;
                const friendName = isRequester ? friend.addressee_name : friend.requester_name;
                const friendEmail = isRequester ? friend.addressee_email : friend.requester_email;
                return (
                  <div key={friend.id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{friendName || "Unknown player"}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{friendEmail || "No email"}</div>
                  </div>
                );
              })}
            </div>
            <PaginationControls
              page={friendsPage}
              totalPages={getTotalPages(friends)}
              onPageChange={setFriendsPage}
              label="Ban be"
            />
          </div>

          <div className="rounded-[30px] border border-amber-200/60 bg-white p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loi moi dang cho</h2>
            {!isLoading && pendingRequests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Khong co loi moi nao dang cho.</p> : null}
            <div className="mt-4 space-y-3">
              {pagedPending.map((request) => {
                const incoming = request.addressee_id === user?.id;
                const otherUserName = incoming ? request.requester_name : request.addressee_name;
                const otherUserEmail = incoming ? request.requester_email : request.addressee_email;
                const actionUserId = incoming ? request.requester_id : request.addressee_id;
                return (
                  <div key={request.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{otherUserName || "Unknown player"}</div>
                    <div className="mt-1 text-sm text-slate-500">{otherUserEmail}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.15em] text-amber-700">
                      {incoming ? "Incoming request" : "Request sent"}
                    </div>
                    {incoming ? (
                      <Button
                        className="mt-3 rounded-full bg-emerald-700 hover:bg-emerald-600"
                        onClick={() => handleAcceptRequest(actionUserId)}
                        disabled={busyUserId === actionUserId}
                      >
                        {busyUserId === actionUserId ? "Dang chap nhan..." : "Chap nhan"}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <PaginationControls
              page={pendingPage}
              totalPages={getTotalPages(pendingRequests)}
              onPageChange={setPendingPage}
              label="Loi moi"
            />
          </div>

          <div className="rounded-[30px] border border-amber-200/60 bg-white p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tim va ket ban</h2>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tim theo ten hoac email..."
              className="mt-4 border-amber-200"
            />
            <div className="mt-4 space-y-3">
              {candidates.length === 0 ? <p className="text-sm text-slate-500">Khong con tai khoan phu hop.</p> : null}
              {pagedCandidates.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.display_name || item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.email}</div>
                  </div>
                  <Button
                    className="rounded-full bg-amber-900 hover:bg-amber-800"
                    onClick={() => handleSendRequest(item.id)}
                    disabled={busyUserId === item.id}
                  >
                    {busyUserId === item.id ? "Dang gui..." : "Ket ban"}
                  </Button>
                </div>
              ))}
            </div>
            <PaginationControls
              page={candidatesPage}
              totalPages={getTotalPages(candidates)}
              onPageChange={setCandidatesPage}
              label="Nguoi dung"
            />
          </div>
        </div>
    </section>
  );
}
