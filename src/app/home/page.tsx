"use client";

import {
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Plus, Pencil, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import SideDrawer from "@/components/SideDrawer";

/* ---------------- Types ---------------- */
type CalendarItem = {
  id: number;
  title: string;
  dateISO: string;
};

const LS_USER_KEY = "coursify:user";

/* ---- Utilities ---- */
function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const daysInMonth = last.getDate();
  const firstDayOfWeek = (first.getDay() + 6) % 7;

  const cells: Date[] = [];

  const prevLast = new Date(year, monthIndex, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push(new Date(year, monthIndex - 1, prevLast - i));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, monthIndex, d));
  }

  while (cells.length < 42) {
    const nextDay = new Date(
      year,
      monthIndex,
      daysInMonth + (cells.length - (firstDayOfWeek + daysInMonth)) + 1
    );
    cells.push(nextDay);
  }

  return cells;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/* ---------------- Page ---------------- */
export default function HomePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const [memos, setMemos] = useState<CalendarItem[]>([]);
  const [loadingMemos, setLoadingMemos] = useState(false);

  const [selectedISO, setSelectedISO] = useState(toLocalISO(new Date()));

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDateISO, setNewDateISO] = useState(toLocalISO(new Date()));

  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDateISO, setEditDateISO] = useState("");

  /* ---- Load user ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(raw);
      const idNum = Number(user.id);

      if (!idNum) {
        router.push("/login");
        return;
      }

      setUserId(idNum);
    } catch {
      router.push("/login");
    } finally {
      setLoadingUser(false);
    }
  }, [router]);

  /* ---- Load memos ---- */
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoadingMemos(true);
      try {
        const res = await fetch(`/api/memos/list?userId=${userId}`);
        const data = await res.json();
        setMemos(data.memos ?? []);
      } finally {
        setLoadingMemos(false);
      }
    }

    load();
  }, [userId]);

  /* ---- Derived ---- */
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    memos.forEach((m) => {
      (map[m.dateISO] ??= []).push(m);
    });
    return map;
  }, [memos]);

  const nearest = memos
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .find((m) => m.dateISO >= toLocalISO(new Date())) ?? null;

  const daysRemaining = (iso: string) => {
    const today = new Date();
    const target = new Date(iso);
    const diff = Math.ceil(
      (target.getTime() - new Date(
        today.getFullYear(), today.getMonth(), today.getDate()
      ).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return "已過期";
    if (diff === 0) return "今天";
    return `還剩 ${diff} 天`;
  };

  /* ---- Actions ---- */
  const addMemo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDateISO) return;

    const res = await fetch("/api/memos/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: newTitle.trim(),
        dateISO: newDateISO,
      }),
    });

    const data = await res.json();
    setMemos((prev) => [...prev, data.memo]);

    setShowAddForm(false);
    setNewTitle("");
    setSelectedISO(newDateISO);
  };

  const startEdit = (memo: CalendarItem) => {
    setEditing(memo);
    setEditTitle(memo.title);
    setEditDateISO(memo.dateISO);
    setShowAddForm(false);
  };

  const updateMemo = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const res = await fetch(`/api/memo?id=${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        dateISO: editDateISO,
      }),
    });

    const data = await res.json();
    setMemos((prev) =>
      prev.map((m) => (m.id === data.memo.id ? data.memo : m))
    );

    setEditing(null);
    setSelectedISO(editDateISO);
  };

  const deleteMemo = async (memo: CalendarItem) => {
    if (!confirm(`確定刪除「${memo.title}」？`)) return;

    await fetch(`/api/memo?id=${memo.id}`, { method: "DELETE" });
    setMemos((prev) => prev.filter((m) => m.id !== memo.id));
  };

  /* ---- Render ---- */
  if (loadingUser) {
    return (
      <PageShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500 text-sm">載入中…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNav={(p) => router.push(p)}
      />

      {/* --- 外層：跟 CoursesPage 完全一致，並加 no-scrollbar --- */}
      <div className="flex h-full w-full flex-col overflow-y-auto no-scrollbar">

        {/* ==== Header（滿版藍色 banner）==== */}
        <div className="relative rounded-b-3xl bg-gradient-to-br from-[#3B82F6] to-[#7aa8ff] px-6 pt-8 pb-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="mt-6 text-3xl font-bold text-white">智慧提醒</h1>
          <p className="mt-2 text-white/90 text-sm">查看重要行程、作業與考試</p>
        </div>

        {/* ==== 页面主內容 ==== */}
        <div className="px-4 py-5 space-y-4">

          {/* 最近提醒 */}
          <div className="flex items-center gap-2 rounded-[14px] bg-white px-4 py-3 shadow-sm">
            <Bell className="h-5 w-5 text-[#3B82F6]" />

            {loadingMemos ? (
              <span className="text-gray-500 text-sm">載入中…</span>
            ) : nearest ? (
              <span className="text-sm text-[#0B1015]">
                通知：{nearest.title}（{nearest.dateISO}）{daysRemaining(nearest.dateISO)}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">目前沒有提醒事項</span>
            )}
          </div>

          {/* 月曆 */}
          <div className="rounded-[14px] bg-white p-4 shadow-sm">

            {/* 月份切換 */}
            <div className="flex items-center justify-between mb-3">
              <button
                className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
              >
                上個月
              </button>

              <div className="text-sm text-gray-700">
                {MONTHS[month]} {year}
              </div>

              <button
                className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
              >
                下個月
              </button>
            </div>

            {/* 星期 */}
            <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date, idx) => {
                const iso = toLocalISO(date);
                const inThisMonth = date.getMonth() === month;
                const isToday = iso === toLocalISO(new Date());
                const isSelected = iso === selectedISO;
                const hasItems = (itemsByDate[iso]?.length ?? 0) > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedISO(iso)}
                    className={[
                      "relative h-12 rounded-[10px] border text-sm transition",
                      inThisMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                      isToday ? "border-[#3B82F6]" : "border-gray-200",
                      isSelected ? "ring-2 ring-[#3B82F6]" : "",
                      "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="absolute left-1 top-1 text-[11px]">
                      {date.getDate()}
                    </div>

                    {hasItems && (
                      <div className="absolute bottom-1 left-1 right-1 mx-auto h-1.5 w-10 rounded-full bg-[#3B82F6]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 當天事件 */}
          <div className="rounded-[14px] bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-[#0B1015]">
              {selectedISO} 的事件
            </div>

            <div className="space-y-2">
              {(itemsByDate[selectedISO] ?? []).length === 0 ? (
                <p className="text-gray-500 text-sm">沒有事件</p>
              ) : (
                itemsByDate[selectedISO].map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <p className="text-sm text-[#0B1015]">{it.title}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(it)}
                        className="p-1 rounded-full hover:bg-white"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteMemo(it)}
                        className="p-1 rounded-full hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 編輯區塊 */}
          {editing && (
            <form
              onSubmit={updateMemo}
              className="rounded-[14px] bg-white p-4 shadow-sm space-y-3"
            >
              <div className="text-sm font-semibold">編輯備忘錄</div>

              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10 w-full px-3 rounded-[12px] border shadow-sm text-sm"
                required
              />

              <input
                type="date"
                value={editDateISO}
                onChange={(e) => setEditDateISO(e.target.value)}
                className="h-10 w-full px-3 rounded-[12px] border shadow-sm text-sm"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-[12px] bg-[#3B82F6] text-white text-sm"
                >
                  儲存
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 h-10 rounded-[12px] text-[#3B82F6] text-sm"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {/* 新增按鈕 */}
          <button
            onClick={() => {
              setNewTitle("");
              setNewDateISO(selectedISO);
              setShowAddForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#3B82F6] px-4 py-3 text-sm text-white"
          >
            <Plus className="h-5 w-5" />
            新增備忘錄
          </button>
        </div>

        {/* Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="w-[90%] max-w-md bg-white rounded-2xl p-4 shadow-lg">
              <form onSubmit={addMemo} className="space-y-3">

                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">新增備忘錄</div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-gray-600"
                  >
                    關閉
                  </button>
                </div>

                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10 w-full px-3 border rounded-[12px] shadow-sm text-sm"
                  placeholder="事件標題"
                  required
                />

                <input
                  type="date"
                  value={newDateISO}
                  onChange={(e) => setNewDateISO(e.target.value)}
                  className="h-10 w-full px-3 border rounded-[12px] shadow-sm text-sm"
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-[#3B82F6] text-white rounded-[12px] text-sm"
                  >
                    新增
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 h-10 rounded-[12px] text-[#3B82F6] text-sm"
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
