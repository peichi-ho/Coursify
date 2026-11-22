// src/components/AppShell.tsx
// 登入後所有頁面共用的版型：
//   桌機（md 以上）：左側固定導覽列 + 上方工具列
//   手機：上方精簡工具列 + 底部分頁列
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Coins,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  MessagesSquare,
  Search,
  Wallet,
} from "lucide-react";

const LS_USER_KEY = "coursify:user";

const NAV = [
  { href: "/home", label: "首頁", icon: Home },
  { href: "/courses", label: "課程討論", icon: MessagesSquare },
  { href: "/notes", label: "筆記市集", icon: FileText },
  { href: "/reminders", label: "提醒", icon: CalendarDays },
  { href: "/wallet", label: "錢包", icon: Wallet },
];

type ShellUser = { name: string; points: number };

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ShellUser | null>(null);

  // 以後端 session 為準；cookie 失效就回登入頁
  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/me")
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem(LS_USER_KEY);
          router.replace("/login");
          return;
        }
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.user) {
          setUser({ name: data.user.name, points: data.user.points });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(LS_USER_KEY);
    localStorage.removeItem("coursify:courses");
    router.push("/login");
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ||
    (href === "/courses" && pathname.startsWith("/chat"));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 桌機側欄 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <Link href="/home" className="flex items-center gap-2 px-5 py-5">
          <GraduationCap className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-semibold tracking-tight">Coursify</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(href)
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-200 p-3">
          <Link
            href="/profile"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              isActive("/profile") ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-[18px] w-[18px]" />
            個人資料與選課
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-[18px] w-[18px]" />
            登出
          </button>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* 上方工具列 */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
            <Link href="/home" className="flex items-center gap-2 md:hidden">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Coursify</span>
            </Link>
            <div className="hidden flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 md:flex">
              <Search className="h-4 w-4" />
              搜尋課程、筆記或討論
            </div>
            <div className="flex-1 md:hidden" />
            <Link
              href="/wallet"
              className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
            >
              <Coins className="h-4 w-4" />
              {user ? user.points : "–"} 點
            </Link>
            <Link
              href="/profile"
              aria-label="個人資料"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700"
            >
              {user?.name?.slice(0, 1) ?? ""}
            </Link>
            <button
              onClick={logout}
              aria-label="登出"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* 主內容：手機底部留空間給分頁列 */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              </div>
              {actions}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* 手機底部分頁列 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              isActive(href) ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
