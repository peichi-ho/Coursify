// src/app/notes/[courseId]/page.tsx
"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Menu, Plus, Eye } from "lucide-react";
import PageShell from "@/components/PageShell";
import SideDrawer from "@/components/SideDrawer";

const LS_USER_KEY = "coursify:user";

type NoteItem = {
  id: number;
  authorName: string;
  title: string;
  price: number;
  fileUrl?: string | null;
  // 之後如果後端有另外做「試閱檔案」欄位，可以改用 previewUrl
  previewUrl?: string | null;
};

export default function CourseNotesPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const courseId = Number(params.courseId);
  const courseName = searchParams.get("name") ?? "課程筆記精華區";

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newFile, setNewFile] = useState<File | null>(null);

  // 讀 userId
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(LS_USER_KEY);
      if (!rawUser) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(rawUser);
      const idNum = Number(user.id);
      if (!idNum || Number.isNaN(idNum)) {
        router.push("/login");
        return;
      }
      setUserId(idNum);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // 載入此課程的筆記
  useEffect(() => {
    if (!courseId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/notes/list?courseId=${courseId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.notes) {
          setNotes([]);
          return;
        }

        // 如果之後後端有多給 previewUrl 就使用，現在先 fallback 用 fileUrl
        const mapped: NoteItem[] = (data.notes as any[]).map((n) => ({
          id: n.id,
          authorName: n.authorName,
          title: n.title,
          price: n.price,
          fileUrl: n.fileUrl ?? null,
          previewUrl: n.previewUrl ?? n.fileUrl ?? null,
        }));

        setNotes(mapped);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [courseId]);

  // 新增筆記（含檔案）
  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!userId || !courseId) return;
    if (!newTitle.trim()) return;

    const priceNumber =
      typeof newPrice === "string" ? Number(newPrice) : newPrice;
    if (Number.isNaN(priceNumber) || priceNumber < 0) return;

    // 🔴 檔案必填
    if (!newFile) {
      alert("請上傳筆記檔案");
      return;
    }

    const formData = new FormData();
    formData.append("userId", String(userId));
    formData.append("courseId", String(courseId));
    formData.append("title", newTitle.trim());
    formData.append("price", String(priceNumber));
    formData.append("file", newFile);

    const res = await fetch("/api/notes/add", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.note) {
      alert(data?.error ?? "新增筆記失敗");
      return;
    }

    // 同樣做成 NoteItem 形式
    const n = data.note;
    const newNote: NoteItem = {
      id: n.id,
      authorName: n.authorName,
      title: n.title,
      price: n.price,
      fileUrl: n.fileUrl ?? null,
      previewUrl: n.previewUrl ?? n.fileUrl ?? null,
    };

    setNotes((prev) => [newNote, ...prev]);
    setShowAdd(false);
    setNewTitle("");
    setNewPrice("");
    setNewFile(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setNewFile(file);
  }

  // ⭐ 試閱一頁（目前先是示意：打開預覽連結）
  async function handlePreview(note: NoteItem) {
    if (!note.previewUrl && !note.fileUrl) {
      alert("此筆記尚未提供試閱檔案");
      return;
    }

    // 目前版本：直接打開檔案做「試閱示意」
    // 之後如果你有做 /api/notes/preview?id=xxx，就改成那個網址
    const url =
      note.previewUrl ??
      note.fileUrl ??
      "";

    if (!url) {
      alert("此筆記尚未提供試閱檔案");
      return;
    }

    window.open(url, "_blank");
  }

  // ⭐ 購買筆記：扣點數 + 開啟檔案
  async function handleBuy(note: NoteItem) {
    if (!userId) {
      router.push("/login");
      return;
    }

    // 價格為 0 就直接看
    if (!note.price || note.price <= 0) {
      if (note.fileUrl) {
        window.open(note.fileUrl, "_blank");
      } else {
        alert("此筆記暫無上傳檔案");
      }
      return;
    }

    try {
      const res = await fetch("/api/wallet/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: note.price,
          message: `購買筆記：${note.title}`,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        alert(data?.error ?? "購買失敗，可能是點數不足");
        return;
      }

      // 更新 localStorage 的 points（讓 sidebar / 錢包看到最新）
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        stored.points = data.points ?? stored.points;
        localStorage.setItem(LS_USER_KEY, JSON.stringify(stored));
      }

      alert(`購買成功！已扣除 ${note.price} 點，目前點數：${data.points}`);

      if (note.fileUrl) {
        window.open(note.fileUrl, "_blank");
      } else {
        alert("此筆記暫無上傳檔案");
      }
    } catch (e) {
      console.error("購買筆記發生錯誤", e);
      alert("購買筆記失敗");
    }
  }

  return (
    <PageShell>
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNav={(p) => router.push(p)}
      />

      <div className="flex h-full w-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="relative rounded-b-3xl bg-gradient-to-br from-[#3B82F6] to-[#7aa8ff] px-6 pt-8 pb-6">
          <div className="mb-6 flex items-center justify-between">
            <button
              className="rounded-lg p-2 text-white hover:bg-white/20"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-2xl font-semibold text-white truncate max-w-[60%] text-right">
              {courseName}
            </div>
          </div>
          <div className="text-3xl font-bold tracking-wide text-white/95">
            筆記精華區
          </div>
        </div>

        {/* Notes 內容 */}
        <div className="mx-auto w-full max-w-[360px] px-4 sm:px-6 py-6 space-y-6">
          {loading ? (
            <p className="text-center text-sm text-gray-500">筆記載入中…</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              目前還沒有任何筆記，成為第一個上傳的人吧！
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl bg-[#eaf1ff] px-4 py-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-full bg-white shadow-inner" />

                  <div className="min-w-0 flex-1">
                    <div className="text-base text-[#0B1015] font-medium">
                      {n.authorName}
                    </div>

                    <div className="mt-1 truncate text-2xl text-[#0B1015] font-semibold">
                      {n.title}
                    </div>

                    <div className="mt-2 text-sm text-[#0B1015]">
                      售價：${n.price}
                    </div>

                    {n.fileUrl ? (
                      <div className="mt-1 text-xs text-gray-600">
                        已上傳檔案，可先試閱，再決定是否購買完整內容。
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-gray-400">
                        尚未上傳檔案。
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handlePreview(n)}
                      className="flex items-center justify-center rounded-xl bg-white px-3 py-1.5 text-xs text-[#0B1015] shadow hover:bg-gray-50"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      試閱一頁
                    </button>
                    <button
                      onClick={() => handleBuy(n)}
                      className="rounded-xl bg-white px-3 py-1.5 text-sm text-[#0B1015] shadow font-medium hover:bg-gray-50"
                    >
                      我要購買
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 右下角新增筆記按鈕 */}
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-xl hover:bg-[#5091f8]"
          aria-label="新增筆記"
        >
          <Plus className="h-7 w-7" />
        </button>

        {/* 新增筆記 Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[90%] max-w-md rounded-2xl bg-white p-4 shadow-xl">
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-[#0B1015]">
                    新增筆記
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    關閉
                  </button>
                </div>

                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：期中考總整理"
                  className="h-10 w-full rounded-[12px] bg白 px-3 text-sm shadow-sm border focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  required
                />

                <input
                  type="number"
                  min={0}
                  value={newPrice}
                  onChange={(e) =>
                    setNewPrice(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="售價（例如 100）"
                  className="h-10 w-full rounded-[12px] bg白 px-3 text-sm shadow-sm border focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  required
                />

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required // 🔴 檔案必填
                  className="block w-full text-xs text-gray-600"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-[12px] bg-[#3B82F6] text-sm font-semibold text-white hover:bg-[#5091f8]"
                  >
                    新增
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="h-10 rounded-[12px] px-4 text-sm font-semibold text-[#3B82F6] hover:bg-[#e8f1ff]"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
