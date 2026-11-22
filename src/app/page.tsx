// src/app/page.tsx — 未登入時的產品介紹頁
import Link from "next/link";
import {
  CalendarDays,
  Coins,
  FileText,
  GraduationCap,
  MessagesSquare,
} from "lucide-react";

const FEATURES = [
  { icon: MessagesSquare, title: "課程討論區", desc: "同一堂課的同學自動進到同一個討論區，問作業、對考試範圍都在這裡。" },
  { icon: FileText, title: "筆記市集", desc: "上架自己的筆記賺點數，也能先試閱再購買同學的精華整理。" },
  { icon: CalendarDays, title: "智慧提醒", desc: "作業、考試、報告一次排進月曆，到期前在首頁提醒你。" },
  { icon: Coins, title: "點數回饋", desc: "回答問題被發文者加星、筆記被購買，都能累積點數。" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-semibold tracking-tight">Coursify</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            登入
          </Link>
          <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            免費註冊
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center md:px-8 md:pt-20">
        <p className="mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          給大學生的課程協作平台
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          把討論、筆記和提醒，
          <br className="hidden sm:block" />
          集中在你修的每一堂課
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-500">
          不用再在群組、雲端資料夾和行事曆之間切換。選好課，Coursify 幫你把同學和資源接起來。
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
            開始使用
          </Link>
          <Link href="/login" className="w-full rounded-lg border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto">
            我已經有帳號
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
