// src/app/notes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Menu, Notebook } from "lucide-react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import SideDrawer from "@/components/SideDrawer";

const LS_USER_KEY = "coursify:user";

type UICourse = {
  id: number;
  name: string;
  weekday: string | null;
  timeSlot: string | null;
};

export default function NotesCourseSelectPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rawUser = localStorage.getItem(LS_USER_KEY);
        if (!rawUser) {
          router.push("/login");
          return;
        }
        const user = JSON.parse(rawUser);
        const userId = Number(user.id);
        if (!userId || Number.isNaN(userId)) {
          router.push("/login");
          return;
        }

        const res = await fetch(`/api/courses/my?userId=${userId}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.courses) {
          setLoading(false);
          return;
        }

        setCourses(
          (data.courses as any[]).map((c) => ({
            id: c.id,
            name: c.name,
            weekday: c.weekday ?? "",
            timeSlot: c.timeSlot ?? "",
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

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
          <button
            aria-label="開啟選單"
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="mt-6 text-3xl font-bold text-white">筆記精華區</h1>
          <p className="mt-2 text-white/90">請先選擇課程，再查看該課程的筆記</p>
        </div>

        {/* 課程列表 */}
        <div className="px-4 py-5 space-y-4">
          {loading ? (
            <p className="text-center text-sm text-gray-500">課程載入中…</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              目前沒有已選課程，請先在「選課程」頁面新增課程。
            </p>
          ) : (
            courses.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  router.push(
                    `/notes/${c.id}?name=${encodeURIComponent(c.name)}`
                  )
                }
                className="w-full rounded-[16px] bg-[#eef5ff] px-4 py-4 text-left shadow-sm hover:shadow transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                    <Notebook className="h-6 w-6 text-[#3B82F6]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold text-[#0B1015] truncate">
                      {c.name}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600 flex items-center gap-3">
                      <span>{c.weekday}</span>
                      <span className="tracking-wide">{c.timeSlot}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
