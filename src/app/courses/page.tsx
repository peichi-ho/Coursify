"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

type UICourse = {
  id: string;
  name: string;
  emoji: string;
  weekday: string; // 例如「四」、「五」
  slots: string;   // 例如「EFG」、「二三四」
  unread?: number;
};

const LS_USER_KEY = "coursify:user";

export default function CoursesPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFromDb() {
      try {
        const rawUser = localStorage.getItem(LS_USER_KEY);
        if (!rawUser) {
          console.warn("尚未登入，無法載入課程");
          setLoading(false);
          return;
        }

        const user = JSON.parse(rawUser);
        const userId = Number(user.id);
        if (!userId || Number.isNaN(userId)) {
          console.warn("userId 無效，無法載入課程");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/courses/my`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.courses) {
          console.warn("載入課程失敗");
          setLoading(false);
          return;
        }

        // 從後端的 Course 轉成前端 UI 需要的格式
        const mapped: UICourse[] = (data.courses as any[]).map((c) => ({
          id: String(c.id),
          name: c.name,
          emoji: "📘", // 之後可讓使用者自訂
          weekday: c.weekday ?? "",
          slots: c.timeSlot ?? "",
        }));

        setCourses(mapped);
      } catch (e) {
        console.error("載入課程發生錯誤", e);
      } finally {
        setLoading(false);
      }
    }

    loadFromDb();
  }, []);

  return (
    <AppShell title="課程討論" subtitle="選擇一門課，進入同學的討論區">
      <div className="flex w-full flex-col">
        {/* List / 狀態顯示 */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-sm text-gray-500">課程載入中…</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              尚未設定本學期課程，請先在「選課程」頁面新增課程。
            </p>
          ) : (
            courses.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  router.push(`/chat/${c.id}?name=${encodeURIComponent(c.name)}`)
                }
                className="w-full rounded-[16px] bg-[#eef5ff] px-4 py-4 text-left shadow-sm hover:shadow transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                    <span aria-hidden>{c.emoji}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-[#0B1015] truncate">
                        {c.name}
                      </h3>
                      {typeof c.unread === "number" && c.unread > 0 && (
                        <span className="rounded-full bg-[#3B82F6] px-2 py-0.5 text-xs font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex items-center gap-3">
                      <span>{c.weekday}</span>
                      <span className="tracking-wide">{c.slots}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
