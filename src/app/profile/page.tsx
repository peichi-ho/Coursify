// src/app/profile/page.tsx
"use client";

import AppShell from "@/components/AppShell";

import { useEffect, useState, FormEvent } from "react";

const LS_USER_KEY = "coursify:user";

type Course = {
  id: number;
  name: string;
  teacher: string | null;
  weekday: string | null;
  timeSlot: string | null;
};

type Enrollment = {
  id: number;
  course: Course;
};

type UserProfile = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  department: string | null;
  points: number;
  enrollments: Enrollment[];
};

// 🔹 星期選單
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

// 🔹 節次 / 時間選單（跟你原本 select page 的設計一致）
const TIME_SECTIONS = [
  { code: "B", label: "B（07:00）", time: "07:00" },
  { code: "1", label: "1（08:00）", time: "08:00" },
  { code: "2", label: "2（09:00）", time: "09:00" },
  { code: "3", label: "3（10:00）", time: "10:00" },
  { code: "4", label: "4（11:00）", time: "11:00" },
  { code: "C", label: "C（12:00）", time: "12:00" },
  { code: "D", label: "D（13:00）", time: "13:00" },
  { code: "5", label: "5（14:00）", time: "14:00" },
  { code: "6", label: "6（15:00）", time: "15:00" },
  { code: "7", label: "7（16:00）", time: "16:00" },
  { code: "8", label: "8（17:00）", time: "17:00" },
  { code: "E", label: "E（18:00）", time: "18:00" },
  { code: "F", label: "F（19:00）", time: "19:00" },
  { code: "G", label: "G（20:00）", time: "20:00" },
  { code: "H", label: "H（21:00）", time: "21:00" },
];

export default function ProfilePage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // form 狀態
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  // 密碼相關
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 新增課程相關
  const [courseName, setCourseName] = useState("");
  const [courseTeacher, setCourseTeacher] = useState("");
  const [courseWeekday, setCourseWeekday] = useState(""); // 週一～週日
  const [startSection, setStartSection] = useState("");   // 起始節次 code
  const [endSection, setEndSection] = useState("");       // 結束節次 code

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 1️⃣ 拿 localStorage 內的 userId
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const id = Number(parsed.id);
      if (!id || Number.isNaN(id)) return;
      setUserId(id);
    } catch (e) {
      console.error("讀取 localStorage 失敗", e);
    }
  }, []);

  // 2️⃣ 依 userId 讀取 profile
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/me`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.user) {
          setError("無法載入使用者資料");
          return;
        }

        const u: UserProfile = data.user;
        setUser(u);
        setName(u.name);
        setDepartment(u.department ?? "");
      } catch (e) {
        console.error(e);
        setError("載入失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // 3️⃣ 儲存個人資料（含改密碼）
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setMessage(null);

    // 如果有要改密碼 → 檢查舊密碼 + 確認密碼
    if (newPassword) {
      if (!oldPassword) {
        setError("請先輸入舊密碼");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("新密碼與確認密碼不一致");
        return;
      }
    }

    try {
      setSaving(true);

      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          department,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined, // 沒填就不更新
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.user) {
        setError(data?.error ?? "更新失敗");
        return;
      }

      setUser(data.user);
      setMessage("資料已更新");

      // 清空密碼欄位
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.error(e);
      setError("更新過程發生錯誤");
    } finally {
      setSaving(false);
    }
  }

  // 4️⃣ 新增選課（用課程資訊，不用課程 ID）
  async function handleAddEnrollment(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setMessage(null);

    if (!courseName.trim()) {
      setError("請輸入課程名稱");
      return;
    }
    if (!courseWeekday) {
      setError("請選擇上課星期");
      return;
    }
    if (!startSection || !endSection) {
      setError("請選擇起始與結束節次");
      return;
    }

    const startIndex = TIME_SECTIONS.findIndex((t) => t.code === startSection);
    const endIndex = TIME_SECTIONS.findIndex((t) => t.code === endSection);

    if (startIndex === -1 || endIndex === -1) {
      setError("請選擇合法的節次");
      return;
    }
    if (startIndex > endIndex) {
      setError("起始節次不能晚於結束節次");
      return;
    }

    const startObj = TIME_SECTIONS[startIndex];
    const endObj = TIME_SECTIONS[endIndex];

    // 顯示用：B-2（07:00-09:00）
    const timeDisplay = `${startObj.code}-${endObj.code}（${startObj.time}-${endObj.time}）`;

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName: courseName.trim(),
          courseTeacher: courseTeacher.trim() || null,
          weekday: courseWeekday,   // 例如 "一"
          timeSlot: timeDisplay,    // 例如 "B-2（07:00-09:00）"
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.enrollment) {
        setError(data?.error ?? "新增選課失敗");
        return;
      }

      // 重新載入 user（簡單做法）
      const reload = await fetch(`/api/user/me`);
      const reloadData = await reload.json().catch(() => null);
      if (reload.ok && reloadData?.user) {
        setUser(reloadData.user);
      }

      setMessage("已加入選課");

      // 清空表單
      setCourseName("");
      setCourseTeacher("");
      setCourseWeekday("");
      setStartSection("");
      setEndSection("");
    } catch (e) {
      console.error(e);
      setError("新增選課時發生錯誤");
    }
  }

  // 5️⃣ 退選
  async function handleDropEnrollment(enrollmentId: number) {
    if (!userId) return;
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "退選失敗");
        return;
      }

      // 更新前端 state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              enrollments: prev.enrollments.filter((e) => e.id !== enrollmentId),
            }
          : prev
      );
      setMessage("已退選");
    } catch (e) {
      console.error(e);
      setError("退選時發生錯誤");
    }
  }

  if (!userId) {
    return (
      <AppShell>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          尚未登入，請先登入再查看個人資料。
        </div>
      </AppShell>
    );
  }

  if (loading || !user) {
    return (
      <AppShell>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          載入中...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="個人資料與選課">
      <div className="space-y-6">
        {/* 個人資料卡片 */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">基本資料</h2>

          {error && (
            <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  系級
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="例如：資管三"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  學號
                </label>
                <input
                  className="mt-1 w-full rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  value={user.studentId}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  className="mt-1 w-full rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  value={user.email}
                  disabled
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#f3f4ff] px-3 py-2 text-sm text-[#1d4ed8] inline-flex items-center gap-2">
              <span className="font-semibold">目前點數：</span>
              <span>{user.points}</span>
            </div>

            {/* 密碼區塊：舊密碼 + 新密碼 */}
            <div className="mt-6 border-t pt-4">
              <h2 className="text-lg font-semibold text-[#0B1015] mb-2">
                修改密碼
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                為了安全，無法顯示目前密碼，若要修改請輸入舊密碼與新密碼。
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    舊密碼
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    新密碼
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    確認新密碼
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex items-center rounded-xl bg-[#3B82F6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2563eb] disabled:opacity-60"
            >
              {saving ? "儲存中..." : "儲存變更"}
            </button>
          </form>
        </section>

        {/* 選課資訊卡片 */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-[#0B1015] mb-4">選課資訊</h2>

          <form
  onSubmit={handleAddEnrollment}
  className="mb-4 grid gap-3 sm:grid-cols-2"
>
  {/* 課程名稱 */}
  <div className="sm:col-span-2">
    <label className="block text-sm font-medium text-gray-700">
      課程名稱（必填）
    </label>
    <input
      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
      value={courseName}
      onChange={(e) => setCourseName(e.target.value)}
      placeholder="例如：資料庫系統"
    />
  </div>

  {/* 老師 */}
  <div>
    <label className="block text-sm font-medium text-gray-700">
      老師
    </label>
    <input
      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
      value={courseTeacher}
      onChange={(e) => setCourseTeacher(e.target.value)}
      placeholder="例如：王小明"
    />
  </div>

  {/* 上課星期 */}
  <div>
    <label className="block text-sm font-medium text-gray-700">
      上課星期
    </label>
    <select
      value={courseWeekday}
      onChange={(e) => setCourseWeekday(e.target.value)}
      className="mt-1 h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
    >
      <option value="">選擇</option>
      {WEEKDAYS.map((w) => (
        <option key={w} value={w}>
          週{w}
        </option>
      ))}
    </select>
  </div>

  {/* 起始 + 結束節次（同一橫排） */}
  <div className="sm:col-span-2">
    <label className="block text-sm font-medium text-gray-700">
      上課節次
    </label>
    <div className="mt-1 flex gap-3">
      {/* 起始節次 */}
      <div className="flex-1">
        <span className="mb-1 block text-xs text-gray-500">起始節次</span>
        <select
          value={startSection}
          onChange={(e) => setStartSection(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
        >
          <option value="">選擇</option>
          {TIME_SECTIONS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 結束節次 */}
      <div className="flex-1">
        <span className="mb-1 block text-xs text-gray-500">結束節次</span>
        <select
          value={endSection}
          onChange={(e) => setEndSection(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
        >
          <option value="">選擇</option>
          {TIME_SECTIONS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>

  {/* 新增按鈕 */}
  <button
    type="submit"
    className="sm:col-span-2 mt-1 inline-flex items-center justify-center rounded-xl bg-[#10b981] px-4 py-2 text-sm font-semibold text-white hover:bg-[#059669]"
  >
    新增課程並加入選課
  </button>
</form>


          {user.enrollments.length === 0 ? (
            <div className="text-sm text-gray-500">
              目前尚未選任何課程。
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {user.enrollments.map((enroll) => (
                <li
                  key={enroll.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-semibold text-[#0B1015]">
                      {enroll.course.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {enroll.course.teacher ?? "老師未設定"}・
                      {enroll.course.weekday ?? "時間未設定"}{" "}
                      {enroll.course.timeSlot ?? ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDropEnrollment(enroll.id)}
                    className="rounded-xl border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    退選
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
