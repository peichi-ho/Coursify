// src/app/chat/[id]/topic/[tid]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import { Menu, Star } from "lucide-react";
import SideDrawer from "@/components/SideDrawer";

const LS_USER_KEY = "coursify:user";

type MessageItem = {
  id: number;
  authorId: number;
  authorName: string;
  text: string;
  createdAt: string; // ISO
  rewardedByAuthor: boolean; // ⭐ 是否已獲得星星獎勵
};

export default function TopicPage() {
  const router = useRouter();
  const params = useParams<{ id: string; tid: string }>();
  const searchParams = useSearchParams();

  const courseId = Number(params.id);
  const topicId = Number(params.tid);

  const courseName = searchParams.get("name") ?? "課程";
  const initialTitleFromUrl = searchParams.get("title") ?? "主題";

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("我");

  const [topicAuthorId, setTopicAuthorId] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState(initialTitleFromUrl);
  const [topicContent, setTopicContent] = useState("（尚未填寫內容）");
  const [topicCreatedAt, setTopicCreatedAt] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [starringId, setStarringId] = useState<number | null>(null);

  /* ---------- 讀取登入使用者資訊（localStorage） ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      const idNum = Number(stored.id);
      if (!idNum || Number.isNaN(idNum)) return;

      setUserId(idNum);
      if (stored.name) setUserName(String(stored.name));
    } catch {
      // ignore
    }
  }, []);

  const isTopicOwner = useMemo(
    () => !!userId && !!topicAuthorId && userId === topicAuthorId,
    [userId, topicAuthorId]
  );

  /* ---------- 從後端載入 topic + 所有留言 ---------- */
  async function loadMessages() {
    if (!topicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?topicId=${topicId}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.warn("載入留言失敗", data?.message);
        return;
      }

      // ⭐ 從後端真正的 topic 資料更新標題 / 內容 / 建立時間
      if (data.topic) {
        if (data.topic.authorId) {
          setTopicAuthorId(Number(data.topic.authorId));
        }
        if (data.topic.title) {
          setTopicTitle(data.topic.title);
        }
        setTopicContent(
          data.topic.content && data.topic.content.trim()
            ? data.topic.content
            : "（尚未填寫內容）"
        );
        if (data.topic.createdAt) {
          setTopicCreatedAt(data.topic.createdAt);
        }
      }

      const mapped: MessageItem[] = (data.messages ?? []).map((m: any) => ({
        id: m.id,
        authorId: m.authorId,
        authorName: m.authorName ?? "同學",
        text: m.text,
        createdAt: m.createdAt,
        rewardedByAuthor: !!m.rewardedByAuthor,
      }));

      setMessages(mapped);
    } catch (e) {
      console.error("loadMessages error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  /* ---------- 發送新留言 ---------- */
  async function addReply() {
    if (!draft.trim()) return;

    if (!userId) {
      alert("請先登入再留言");
      router.push("/login");
      return;
    }
    if (!topicId) {
      alert("找不到主題 id");
      return;
    }

    const text = draft.trim();
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          userId,
          text,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message ?? "發送留言失敗");
        return;
      }

      const m = data.message;
      const newItem: MessageItem = {
        id: m.id,
        authorId: m.authorId,
        authorName: m.authorName ?? userName,
        text: m.text,
        createdAt: m.createdAt,
        rewardedByAuthor: !!m.rewardedByAuthor,
      };

      setMessages((prev) => [...prev, newItem]);
      setDraft("");
    } catch (e) {
      console.error("addReply error", e);
      alert("伺服器錯誤，請稍後再試");
    } finally {
      setSending(false);
    }
  }

  /* ---------- 主題發文者點星星 → 給留言者 +5 點 ---------- */
  async function rewardMessage(msg: MessageItem) {
    if (!userId) {
      alert("請先登入");
      router.push("/login");
      return;
    }
    if (!isTopicOwner) {
      alert("只有主題發文者可以給星星獎勵");
      return;
    }
    if (msg.rewardedByAuthor) {
      return;
    }

    setStarringId(msg.id);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          topicId,
          giverUserId: userId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message ?? "給獎勵失敗");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, rewardedByAuthor: true } : m
        )
      );

      alert("已給予此留言 5 點獎勵 ✨");
    } catch (e) {
      console.error("rewardMessage error", e);
      alert("伺服器錯誤，請稍後再試");
    } finally {
      setStarringId(null);
    }
  }

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  const handleNav = (path: string) => {
    router.push(path);
  };

  return (
    <PageShell>
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNav={handleNav}
      />

      <div className="relative flex h-full w-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="relative rounded-b-3xl bg-gradient-to-br from-[#3B82F6] to-[#7aa8ff] px-6 pt-8 pb-6">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-white hover:bg-white/20"
              aria-label="menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-2xl font-bold text-white">
              {courseName}
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white/95 tracking-wide">
            課程聊天室
          </div>
        </div>

        {/* 內容區 */}
        <div className="mx-auto w-full max-w-[360px] px-6 py-5">
          {/* 主題內容 */}
          <div className="mb-5 space-y-2 border-b border-gray-300 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-[#e8f1ff]" />
              <div>
                <div className="text-base font-semibold text-[#0B1015]">
                  {topicTitle}
                </div>
                <div className="text-sm font-semibold tracking-widest text-gray-500">
                  {topicCreatedAt
                    ? new Date(topicCreatedAt).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10)}
                </div>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-[#0B1015]">
              {topicContent}
            </p>
          </div>

          {/* 留言列表 */}
          {loading ? (
            <p className="text-center text-sm text-gray-500">
              留言載入中…
            </p>
          ) : sortedMessages.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              還沒有任何留言，成為第一個發言的人吧！
            </p>
          ) : (
            <div className="space-y-6">
              {sortedMessages.map((r) => {
                const canClickStar =
                  isTopicOwner && !r.rewardedByAuthor;

                return (
                  <div
                    key={r.id}
                    className="flex items-start justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-blue-200" />
                      <div>
                        <div className="text-xl font-semibold text-[#0B1015]">
                          {r.authorName}
                        </div>
                        <div className="text-base font-extrabold tracking-widest text-gray-600">
                          {new Date(r.createdAt)
                            .toISOString()
                            .slice(0, 10)}
                        </div>
                        <div className="mt-1 text-[15px] text-[#0B1015] whitespace-pre-wrap">
                          {r.text}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => canClickStar && rewardMessage(r)}
                      disabled={!canClickStar || starringId === r.id}
                      className="rounded-full p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                      aria-label="star"
                      title={
                        r.rewardedByAuthor
                          ? "已給予獎勵"
                          : isTopicOwner
                          ? "給這則留言 5 點獎勵"
                          : "只有主題發文者可以給星星"
                      }
                    >
                      <Star
                        className={`h-5 w-5 ${
                          r.rewardedByAuthor ? "fill-gray-800" : ""
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-24" />
        </div>

        {/* 底部輸入列 */}
        <div className="pointer-events-none sticky bottom-0 z-10 -mt-16 flex w-full justify-center pb-6">
          <div className="pointer-events-auto mx-auto w-full max-w-[360px] px-6">
            <div className="flex items-center rounded-full bg-[#dbe7ff] px-5 py-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="想說些什麼呢..."
                className="mr-3 w-full bg-transparent text-[15px] text-[#0B1015] outline-none placeholder:text-[#0B1015]/60"
              />
              <button
                onClick={addReply}
                disabled={sending || !draft.trim()}
                className="rounded-full bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5091f8] disabled:opacity-60"
              >
                {sending ? "送出中…" : "發送"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
