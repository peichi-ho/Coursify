// src/components/PageShell.tsx
// 登入前頁面（歡迎、登入、註冊、初次選課）用的版型：
// 原本是固定 390px 的手機外框，桌機看起來很空；改成置中卡片，手機上自動滿版。
"use client";
import React from "react";
import { GraduationCap } from "lucide-react";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mb-6 flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-semibold tracking-tight">Coursify</span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
