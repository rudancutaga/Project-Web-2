import { useEffect, useMemo, useState } from "react";
import PaginationControls from "@/components/shared/pagination-controls";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMessage, getMessages } from "@/services/message-service";
import { getUsers } from "@/services/user-service";

const PAGE_SIZE = 4;

function paginate(items, page, pageSize = PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [messageData, userData] = await Promise.all([
          getMessages(),
          getUsers(),
        ]);
        setMessages(messageData.messages || []);
        setUsers(userData.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const candidates = useMemo(
    () => users.filter((item) => item.id !== user?.id),
    [user?.id, users]
  );

  const pagedMessages = useMemo(() => paginate(messages, page), [messages, page]);
  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [messages.length]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!to || !body.trim()) {
      setError("Hay chon nguoi nhan va nhap noi dung tin nhan");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      await createMessage({ to: Number(to), body: body.trim() });
      setBody("");
      const data = await getMessages();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[30px] border border-amber-200/60 bg-white p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Messages</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Hop thu non real-time</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Man nay da noi voi `/social/messages`. Ban co the gui tin nhan va xem lich su trao doi bang user that trong he thong.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Nguoi nhan</label>
              <select
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="flex h-10 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Chon nguoi dung</option>
                {candidates.map((item) => (
                  <option key={item.id} value={item.id}>{item.display_name || item.name} ({item.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Noi dung</label>
              <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Hen ban vao phong game luc 8h toi..." />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="rounded-full bg-amber-900 hover:bg-amber-800" disabled={isSending}>
              {isSending ? "Dang gui..." : "Gui tin nhan"}
            </Button>
          </form>
        </div>

        <div className="rounded-[30px] border border-amber-200/60 bg-white p-6 shadow-[0_18px_50px_rgba(120,53,15,0.08)] dark:border-slate-700 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Lich su tin nhan</h2>
          {isLoading ? <p className="mt-4 text-sm text-slate-500">Dang tai tin nhan...</p> : null}
          <div className="mt-4 space-y-3">
            {!isLoading && messages.length === 0 ? <p className="text-sm text-slate-500">Chua co tin nhan nao.</p> : null}
            {pagedMessages.map((message) => {
              const outgoing = message.sender_id === user?.id;
              return (
                <article
                  key={message.id}
                  className={`rounded-2xl p-4 ${outgoing ? "border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"}`}
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {message.sender_name || `User ${message.sender_id}`} {"->"} {message.receiver_name || `User ${message.receiver_id}`}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message.body}</p>
                  <div className="mt-2 text-xs text-slate-400">{message.created_at}</div>
                </article>
              );
            })}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label="Tin nhan"
          />
        </div>
    </section>
  );
}
