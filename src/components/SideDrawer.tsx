"use client";

import { useEffect, useState } from "react";
import { Bell, MessageSquare, NotebookPen, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const LS_USER_KEY = "coursify:user";

export default function SideDrawer({
  open,
  onClose,
  onNav,
}: {
  open: boolean;
  onClose: () => void;
  onNav: (path: string) => void;
}) {
  const router = useRouter();

  const [userName, setUserName] = useState("使用者");
  const [userDepartment, setUserDepartment] = useState("系級");
  const [points, setPoints] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);

  // 1️⃣ 先從 localStorage 拿 userId
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) return;

      const user = JSON.parse(raw);
      const id = Number(user.id);
      if (!id || Number.isNaN(id)) return;

      setUserId(id);
    } catch {
      console.warn("Failed to load userId");
    }
  }, []);

  // 2️⃣ 每次 Sidebar 打開時 → 從後端取得最新資料
  useEffect(() => {
    if (!open || !userId) return;

    async function fetchUser() {
      try {
        const res = await fetch(`/api/user/me?userId=${userId}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.user) return;

        setUserName(data.user.name);
        setUserDepartment(data.user.department ?? "系級");
        setPoints(data.user.points ?? 0);
      } catch (e) {
        console.error("載入使用者資料失敗", e);
      }
    }

    fetchUser();
  }, [open, userId]);

  return (
    <>
      {/* 背景黑幕 */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* 側邊抽屜 */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 h-full w-[82%] max-w-[360px] bg-white shadow-2xl transition-transform rounded-r-3xl",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* 使用者資訊 */}
        <div className="px-5 pt-8 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-[#e8f1ff]" />
            <div>
              {/* 🔹 這裡變成可以點的名字 */}
              <button
                onClick={() => {
                  onNav("/profile");
                  onClose();
                }}
                className="text-2xl font-bold text-[#0B1015] hover:underline text-left"
              >
                {userName}
              </button>
              <div className="text-[#6b7280]">{userDepartment}</div>

              {/* 點數按鈕 → 動態更新 */}
              <button
                onClick={() => {
                  onNav("/wallet");
                  onClose();
                }}
                className="mt-2 inline-flex items-center rounded-xl bg-[#e8f1ff] px-3 py-1 text-sm font-semibold text-[#3B82F6]"
              >
                點數：{points}
              </button>
            </div>
          </div>
        </div>

        {/* 選單 */}
        <nav className="px-4 py-3 space-y-1">
          <button
            onClick={() => {
              onNav("/home");
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg hover:bg-gray-50"
          >
            <Bell className="h-5 w-5 text-[#3B82F6]" />
            智慧提醒
          </button>

          <button
            onClick={() => {
              onNav("/courses");
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg hover:bg-gray-50"
          >
            <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
            課程聊天室
          </button>

          <button
            onClick={() => {
              onNav("/notes");
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg hover:bg-gray-50"
          >
            <NotebookPen className="h-5 w-5 text-[#3B82F6]" />
            筆記精華區
          </button>

          <button
            onClick={() => {
              onNav("/login");
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg hover:bg-gray-50 mt-2"
          >
            <LogOut className="h-5 w-5 text-[#3B82F6]" />
            登出
          </button>
        </nav>
      </aside>
    </>
  );
}
