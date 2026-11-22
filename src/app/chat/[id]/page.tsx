// src/app/chat/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Menu, MessageSquarePlus, Plus } from "lucide-react";

const LS_USER_KEY = "coursify:user";

type TopicItem = {
  id: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  lastMessage: string | null;
};

export default function CourseChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const courseId = Number(params.id);
  const courseName = searchParams.get("name") ?? "課程";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [userId, setUserId] = useState<number | null>(null);

  // 🔹 控制「新增主題」的彈出視窗
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) return;
      const user = JSON.parse(raw);
      const idNum = Number(user.id);
      if (!idNum || Number.isNaN(idNum)) return;
      setUserId(idNum);
    } catch {
      // ignore
    }
  }, []);

  async function loadTopics() {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/topics?courseId=${courseId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("載入主題失敗", data?.message);
        return;
      }
      setTopics(data.topics ?? []);
    } catch (e) {
      console.error("loadTopics error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
  }, [courseId]);

  async function createTopic() {
    if (!userId) {
      alert("請先登入");
      router.push("/login");
      return;
    }
    if (!newTitle.trim()) {
      alert("標題不可空白");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/chat/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message ?? "新增主題失敗");
        return;
      }

      setNewTitle("");
      setNewContent("");
      setShowAddModal(false);
      await loadTopics();
    } catch (e) {
      console.error("createTopic error", e);
      alert("伺服器錯誤");
    } finally {
      setSubmitting(false);
    }
  }

  const handleNav = (path: string) => {
    router.push(path);
  };

  return (
    <AppShell title={courseName} subtitle="課程討論區・和同學一起討論作業、考試與課堂內容">
      <div className="flex w-full flex-col">
        {/* Topics list */}
        <div className="space-y-4 pb-20">
          {loading ? (
            <p className="text-center text-sm text-gray-500">主題載入中…</p>
          ) : topics.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              還沒有任何討論，快來發佈第一篇主題吧！
            </p>
          ) : (
            topics.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  router.push(
                    `/chat/${courseId}/topic/${t.id}?name=${encodeURIComponent(
                      courseName
                    )}&title=${encodeURIComponent(t.title)}`
                  )
                }
                className="w-full text-left rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0B1015]">
                      {t.authorName}
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#0B1015] truncate">
                      {t.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                    {t.lastMessage && (
                      <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                        最新留言：{t.lastMessage}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 📍 右下角浮動「新增主題」按鈕 */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-6 z-30 md:bottom-8 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-xl hover:bg-[#5091f8]"
        aria-label="新增討論主題"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 🧊 新增主題的彈出視窗 Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
          aria-modal="true"
          role="dialog"
        >
          <div className="w-[90%] max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-[#3B82F6]" />
                <span className="text-sm font-semibold text-[#0B1015]">
                  新增討論主題
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                關閉
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="主題標題（例如：期中考範圍討論）"
                className="h-10 w-full rounded-xl bg-white px-3 text-sm shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="想說些什麼？（選填）"
                className="h-24 w-full rounded-xl bg白 px-3 py-2 text-sm shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#3B82F6] hover:bg-[#e8f1ff]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={createTopic}
                  disabled={submitting}
                  className="rounded-full bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5091f8] disabled:opacity-70"
                >
                  {submitting ? "發佈中…" : "發佈主題"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
