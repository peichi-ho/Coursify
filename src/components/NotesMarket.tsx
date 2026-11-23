// src/components/NotesMarket.tsx
// 筆記市集：/notes（全部課程）與 /notes/[courseId]（單一課程）共用。
// 購買走 /api/notes/[id]/purchase；檔案走 /api/notes/[id]/file（後端檢查權限、發短效網址）。
"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Plus, Upload, X } from "lucide-react";
import AppShell from "@/components/AppShell";

const LS_USER_KEY = "coursify:user";

type Course = { id: number; name: string };
type NoteItem = {
  id: number;
  authorName: string;
  title: string;
  price: number;
  hasFile: boolean;
  soldCount: number;
  isMine: boolean;
  purchased: boolean;
  courseId: number;
  courseName: string;
};
type ApiNote = Omit<NoteItem, "courseId" | "courseName">;

async function fetchCourseNotes(course: Course): Promise<NoteItem[]> {
  const res = await fetch(`/api/notes/list?courseId=${course.id}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.notes) return [];
  return (data.notes as ApiNote[]).map((n) => ({
    ...n,
    courseId: course.id,
    courseName: course.name,
  }));
}

export default function NotesMarket({ initialCourseId }: { initialCourseId?: number }) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<number | "all">(initialCourseId ?? "all");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newCourseId, setNewCourseId] = useState<number | "">(initialCourseId ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // 載入我的課程與筆記
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/courses/my");
        const data = await res.json().catch(() => null);
        const list: Course[] = (data?.courses ?? []).map((c: Course) => ({ id: c.id, name: c.name }));
        const all = (await Promise.all(list.map(fetchCourseNotes))).flat();
        if (cancelled) return;
        setCourses(list);
        setNotes(all.sort((a, b) => b.id - a.id));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => (selected === "all" ? notes : notes.filter((n) => n.courseId === selected)),
    [notes, selected]
  );
  const selectedName =
    selected === "all" ? null : courses.find((c) => c.id === selected)?.name ?? null;

  function selectCourse(id: number | "all") {
    setSelected(id);
    // 同步網址，讓重新整理或分享連結時停在同一門課
    const course = courses.find((c) => c.id === id);
    router.replace(id === "all" ? "/notes" : `/notes/${id}?name=${encodeURIComponent(course?.name ?? "")}`, {
      scroll: false,
    });
  }

  function syncLocalPoints(points: number | undefined) {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw && typeof points === "number") {
        const stored = JSON.parse(raw);
        stored.points = points;
        localStorage.setItem(LS_USER_KEY, JSON.stringify(stored));
      }
    } catch {}
  }

  const [busyId, setBusyId] = useState<number | null>(null);

  // 先開一個空白分頁再填網址：等 fetch 回來才 window.open 會被瀏覽器當成彈出視窗擋掉
  async function openFile(note: NoteItem) {
    const win = window.open("", "_blank");
    const res = await fetch(`/api/notes/${note.id}/file`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) {
      win?.close();
      alert(data?.error ?? "無法開啟檔案");
      return;
    }
    if (win) win.location.replace(data.url);
    else window.location.assign(data.url);
  }

  async function handleBuy(note: NoteItem) {
    if (!confirm(`確定用 ${note.price} 點購買「${note.title}」？`)) return;
    setBusyId(note.id);
    try {
      const res = await fetch(`/api/notes/${note.id}/purchase`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error ?? "購買失敗");
        return;
      }
      syncLocalPoints(data.points);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id ? { ...n, purchased: true, soldCount: n.soldCount + 1 } : n
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  function openAdd() {
    setNewCourseId(selected === "all" ? courses[0]?.id ?? "" : selected);
    setFormError("");
    setShowAdd(true);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const priceNumber = typeof newPrice === "string" ? Number(newPrice) : newPrice;
    if (!newCourseId) return setFormError("請選擇課程");
    if (!newTitle.trim()) return setFormError("請輸入標題");
    if (!Number.isInteger(priceNumber) || priceNumber < 0) return setFormError("售價需為 0 以上的整數");
    if (!newFile) return setFormError("請選擇要上傳的檔案");

    const formData = new FormData();
    formData.append("courseId", String(newCourseId));
    formData.append("title", newTitle.trim());
    formData.append("price", String(priceNumber));
    formData.append("file", newFile);

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes/add", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.note) return setFormError(data?.error ?? "新增筆記失敗");
      const n = data.note;
      const course = courses.find((c) => c.id === newCourseId);
      setNotes((prev) => [
        { ...(n as ApiNote), courseId: Number(newCourseId), courseName: course?.name ?? "" },
        ...prev,
      ]);
      setShowAdd(false);
      setNewTitle("");
      setNewPrice("");
      setNewFile(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title={selectedName ? `${selectedName}・筆記` : "筆記市集"}
      subtitle="分享你的課堂筆記賺點數，或先試閱同學的整理再購買"
      actions={
        <button
          onClick={openAdd}
          disabled={courses.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          上架筆記
        </button>
      }
    >
      {/* 課程篩選：手機可左右滑動 */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {[{ id: "all" as const, name: "全部課程" }, ...courses].map((c) => (
          <button
            key={c.id}
            onClick={() => selectCourse(c.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              selected === c.id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          先到「個人資料與選課」加入課程，就能看到該課程的筆記。
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">這裡還沒有筆記，成為第一個上傳的人吧</p>
          <button onClick={openAdd} className="mt-4 text-sm font-medium text-blue-600 hover:underline">
            上架筆記
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => (
            <article key={n.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-slate-50">
                <FileText className="h-9 w-9 text-slate-300" />
              </div>
              <span className="mb-1 w-fit rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                {n.courseName}
              </span>
              <h3 className="line-clamp-2 font-medium">{n.title}</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {n.isMine ? "我的筆記" : n.authorName}・已售 {n.soldCount}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-lg font-semibold">{n.price > 0 ? `${n.price} 點` : "免費"}</span>
                {n.isMine || n.purchased || n.price <= 0 ? (
                  <button
                    onClick={() => openFile(n)}
                    disabled={!n.hasFile}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {n.purchased && <Check className="h-4 w-4 text-emerald-600" />}
                    {n.hasFile ? "開啟" : "無檔案"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(n)}
                    disabled={busyId === n.id}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {busyId === n.id ? "購買中…" : "購買"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 上架筆記：手機從底部滑出、桌機置中 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">上架筆記</h2>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="關閉" className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">課程</span>
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">標題</span>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="期中考總整理"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">售價（點數，0 為免費）</span>
              <input
                type="number"
                min={0}
                step={1}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="20"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="truncate">{newFile ? newFile.name : "選擇檔案（PDF、Word、PPT、圖片）"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "上傳中…" : "上架"}
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
