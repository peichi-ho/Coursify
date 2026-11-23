// src/app/home/page.tsx — 登入後首頁（儀表板）
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  MessagesSquare,
  Plus,
} from "lucide-react";
import AppShell from "@/components/AppShell";

type Dashboard = {
  user: { id: number; name: string; points: number };
  today: string;
  courses: {
    id: number;
    name: string;
    teacher: string | null;
    weekday: string | null;
    timeSlot: string | null;
    topicCount: number;
  }[];
  upcoming: { id: number; title: string; dateISO: string }[];
  upcomingCount: number;
  notes: {
    id: number;
    title: string;
    price: number;
    authorName: string;
    courseId: number;
    courseName: string;
    hasFile: boolean;
  }[];
};

const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];

function daysUntil(iso: string, todayISO: string) {
  const diff = Math.round(
    (new Date(iso).getTime() - new Date(todayISO).getTime()) / 86_400_000
  );
  if (diff <= 0) return { text: "今天", urgent: true };
  if (diff === 1) return { text: "明天", urgent: true };
  return { text: `${diff} 天後`, urgent: false };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) throw new Error(json?.error ?? "載入失敗");
        setData(json);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const todayWeekday = WEEKDAY_ZH[new Date().getDay()];
  const todayCourses = data?.courses.filter((c) => c.weekday === todayWeekday) ?? [];
  const urgentCount =
    data?.upcoming.filter((m) => daysUntil(m.dateISO, data.today).urgent).length ?? 0;

  return (
    <AppShell>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* 問候 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}{data ? `，${data.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {data
            ? `今天有 ${todayCourses.length} 堂課${urgentCount ? `，${urgentCount} 項提醒在兩天內到期` : ""}。`
            : "載入中…"}
        </p>
      </div>

      {/* 統計卡 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "已選課程", value: data?.courses.length },
          { label: "待辦提醒", value: data?.upcomingCount },
          { label: "目前點數", value: data?.user.points },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500 sm:text-sm">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value ?? "–"}</div>
          </div>
        ))}
      </div>

      {/* 今日課程 + 即將到來 */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">今日課程・週{todayWeekday}</h2>
            <Link href="/courses" className="text-sm text-blue-600 hover:underline">
              全部課程
            </Link>
          </div>
          {todayCourses.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">今天沒有課，好好休息</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayCourses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/chat/${c.id}?name=${encodeURIComponent(c.name)}`}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {c.teacher ?? ""} {c.timeSlot ?? ""}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {c.topicCount} 則討論
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">即將到來</h2>
            <Link href="/reminders" className="text-sm text-blue-600 hover:underline">
              開啟月曆
            </Link>
          </div>
          {!data || data.upcoming.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">沒有待辦事項</p>
              <Link
                href="/reminders"
                className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Plus className="h-4 w-4" /> 新增提醒
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcoming.map((m) => {
                const d = daysUntil(m.dateISO, data.today);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    {d.urgent ? (
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                    ) : (
                      <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                    <span className={`shrink-0 text-xs ${d.urgent ? "text-red-600" : "text-slate-500"}`}>
                      {d.text}・{m.dateISO.slice(5).replace("-", "/")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 熱門筆記 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">你修的課的最新筆記</h2>
          <Link href="/notes" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            筆記市集 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {!data || data.notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            還沒有同學上傳筆記，成為第一個分享的人吧
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.notes.map((n) => (
              <Link
                key={n.id}
                href={`/notes/${n.courseId}?name=${encodeURIComponent(n.courseName)}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300"
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-50">
                  <FileText className="h-7 w-7 text-slate-300 group-hover:text-blue-400" />
                </div>
                <div className="truncate text-sm font-medium">{n.title}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {n.courseName}・{n.authorName}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {n.price > 0 ? `${n.price} 點` : "免費"}
                  </span>
                  <span className="text-xs text-blue-600">查看</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {data && data.courses.length === 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <MessagesSquare className="h-5 w-5 shrink-0" />
          你還沒有選課。到「個人資料與選課」加入課程，就能看到同學的討論和筆記。
          <Link href="/profile" className="ml-auto shrink-0 font-medium underline">
            去選課
          </Link>
        </div>
      )}
    </AppShell>
  );
}
