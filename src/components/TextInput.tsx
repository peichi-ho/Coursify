"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Image as ImageIcon, Smartphone } from "lucide-react";
import PageShell from "@/components/PageShell"; // ✅ 用你的手機外框

type Errors = {
  email?: string;
  password?: string;
  confirm?: string;
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): boolean {
    const next: Errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) next.email = "請輸入有效的電子郵件";
    if (password.length < 8) next.password = "密碼需至少 8 個字元";
    if (confirm !== password) next.confirm = "兩次密碼不一致";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      alert("驗證成功，下一步...");
    }
  }

  return (
    <PageShell>
      {/* 讓內容在「手機外框」裡置中且留適度內距 */}
      <div className="mx-auto w-full max-w-[360px] px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative h-14 w-14 rounded-2xl bg-[#e8f1ff]">
            <div className="absolute inset-0 flex items-center justify-center">
              <Smartphone className="h-7 w-7 text-[#3B82F6]" />
              <div className="absolute -right-1 -top-1 rounded-md bg-white p-1 shadow">
                <ImageIcon className="h-4 w-4 text-[#3B82F6]" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="mb-6 text-center text-3xl font-bold text-[#0B1015]">註冊</h1>

        {/* Form */}
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <Mail className="h-4 w-4 text-[#3B82F6]" />
              電子郵件帳號
            </label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入您的電子郵件"
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.email ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.email ? (
              <span className="text-sm text-[#ef4444]">{errors.email}</span>
            ) : null}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <Lock className="h-4 w-4 text-[#3B82F6]" />
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入您的密碼"
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.password ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.password ? (
              <span className="text-sm text-[#ef4444]">{errors.password}</span>
            ) : (
              <span className="text-sm text-[#6b7280]">至少 8 個字元</span>
            )}
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0B1015]">
              <Lock className="h-4 w-4 text-[#3B82F6]" />
              確認密碼
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次輸入您的密碼"
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.confirm ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.confirm ? (
              <span className="text-sm text-[#ef4444]">{errors.confirm}</span>
            ) : null}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 h-12 w-full rounded-[14px] bg-[#3B82F6] text-[16px] font-semibold text-white transition-colors hover:bg-[#5091f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B82F6]"
          >
            下一步
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6b7280]">
          已有帳號？{" "}
          <Link href="/login" className="font-semibold text-[#3B82F6] underline-offset-4 hover:underline">
            立即登入
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
