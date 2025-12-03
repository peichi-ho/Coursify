"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { BookOpen, User, CalendarClock, Clock3, X, Plus } from "lucide-react";

type Course = {
  id: string;
  name: string;    // 課名
  teacher: string; // 老師
  weekday: string; // 星期
  time: string;    // 節次/時間（例如 B-2（07:00-09:00））
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

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

const LS_COURSES_KEY = "coursify:courses";
const LS_USER_KEY = "coursify:user";

export default function SelectCoursesPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [weekday, setWeekday] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isAddDisabled = useMemo(() => {
    return !name.trim() || !teacher.trim() || !weekday || !start || !end;
  }, [name, teacher, weekday, start, end]);

  function addCourse() {
    if (isAddDisabled) return;

    const startIndex = TIME_SECTIONS.findIndex((t) => t.code === start);
    const endIndex = TIME_SECTIONS.findIndex((t) => t.code === end);

    if (startIndex === -1 || endIndex === -1) {
      alert("請選擇合法的節次");
      return;
    }

    // 起始不能晚於結束
    if (startIndex > endIndex) {
      alert("起始節次不能晚於結束節次");
      return;
    }

    const startObj = TIME_SECTIONS[startIndex];
    const endObj = TIME_SECTIONS[endIndex];

    // 顯示用：B-2（07:00-09:00）
    const timeDisplay = `${startObj.code}-${endObj.code}（${startObj.time}-${endObj.time}）`;

    const id = `${name}-${weekday}-${startObj.code}-${endObj.code}-${Date.now()}`;
    setCourses((prev) => [
      ...prev,
      {
        id,
        name,
        teacher,
        weekday,
        time: timeDisplay,
      },
    ]);

    setName("");
    setTeacher("");
    setWeekday("");
    setStart("");
    setEnd("");
  }

  function removeCourse(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  // ✅ 完成選課：呼叫後端 API 寫入資料庫
  async function onNext() {
    if (courses.length === 0) {
      alert("請至少加入一門課程再繼續！");
      return;
    }

    // 從 localStorage 取得註冊後存的 user（裡面要有 id）
    let userId: number | null = null;
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        userId = Number(user.id);
      }
    } catch {
      // ignore
    }

    if (!userId || Number.isNaN(userId)) {
      alert("找不到登入資訊，請重新登入後再選課。");
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      // 後端 timeSlot 就先用顯示文字（例如 B-2（07:00-09:00））
      const payload = {
        userId,
        courses: courses.map((c) => ({
          name: c.name,
          teacher: c.teacher,
          weekday: c.weekday,
          timeSlot: c.time,
        })),
      };

      const res = await fetch("/api/courses/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message ?? "儲存選課失敗，請稍後再試");
        return;
      }

      try {
        localStorage.setItem(LS_COURSES_KEY, JSON.stringify(courses));
      } catch {
        console.warn("無法儲存課程資料到 localStorage");
      }

      alert("選課已儲存！");
      router.push("/home");
    } catch (err) {
      console.error(err);
      alert("伺服器錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[360px] px-6 sm:px-8 py-8">
        <h1 className="mb-4 text-center text-3xl font-bold text-[#0B1015]">
          選課程
        </h1>
        <p className="mb-6 text-center text-sm text-[#6b7280]">
          輸入你本學期的課程，加入下方清單。
        </p>

        {/* 輸入區 */}
        <div className="space-y-4">
          {/* 課名 */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <BookOpen className="h-4 w-4 text-[#3B82F6]" />
              課名
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如 資料庫管理"
              className="h-12 w-full rounded-[14px] bg-white px-4 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          {/* 老師 */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <User className="h-4 w-4 text-[#3B82F6]" />
              老師
            </label>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="如 王小明 （多位老師請用頓號隔開）"
              className="h-12 w-full rounded-[14px] bg-white px-4 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          {/* 星期 + 起始節次 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 星期 */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
                <CalendarClock className="h-4 w-4 text-[#3B82F6]" />
                星期
              </label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
                className="h-12 w-full rounded-[14px] bg-white px-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                <option value="">選擇</option>
                {WEEKDAYS.map((w) => (
                  <option key={w} value={w}>
                    週{w}
                  </option>
                ))}
              </select>
            </div>

            {/* 起始節次 */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
                <Clock3 className="h-4 w-4 text-[#3B82F6]" />
                起始節次
              </label>
              <select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-12 w-full rounded-[14px] bg-white px-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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

          {/* 結束節次 */}
          <div className="flex flex-col gap-2 mt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <Clock3 className="h-4 w-4 text-[#3B82F6]" />
              結束節次
            </label>
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-12 w-full rounded-[14px] bg-white px-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="">選擇</option>
              {TIME_SECTIONS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 新增按鈕 */}
          <button
            type="button"
            disabled={isAddDisabled}
            onClick={addCourse}
            className={[
              "mt-2 h-12 w-full rounded-[14px] text-[16px] font-semibold text-white transition-colors flex items-center justify-center gap-2",
              isAddDisabled
                ? "bg-[#93c5fd] cursor-not-allowed"
                : "bg-[#3B82F6] hover:bg-[#5091f8]",
            ].join(" ")}
          >
            <Plus className="h-5 w-5" />
            加入課程
          </button>
        </div>

        {/* 已加入清單 */}
        <div className="mt-6 space-y-3">
          {courses.length === 0 ? (
            <p className="text-center text-sm text-[#6b7280]">
              尚未加入任何課程
            </p>
          ) : (
            courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[14px] border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-sm text-[#6b7280] truncate">
                    {c.teacher}・週{c.weekday}・{c.time}
                  </div>
                </div>
                <button
                  onClick={() => removeCourse(c.id)}
                  className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                  aria-label="移除課程"
                >
                  <X className="h-5 w-5 text-[#ef4444]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 下一步 */}
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="mt-6 h-12 w-full rounded-[14px] bg-[#3B82F6] text-[16px] font-semibold text-white transition-colors hover:bg-[#5091f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B82F6] disabled:opacity-70 disabled:cursor-wait"
        >
          {submitting ? "儲存中…" : "完成"}
        </button>
      </div>
    </PageShell>
  );
}
