"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useRouter } from "next/navigation";

type Errors = {
  account?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate(): boolean {
    const next: Errors = {};
    if (!account.trim()) {
      next.account = "請輸入帳號";
    }
    if (password.length < 8) {
      next.password = "密碼需至少 8 個字元";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
  
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });
  
      const data = await res.json().catch(() => null);
  
      if (!res.ok) {
        alert(data?.message ?? "登入失敗，請確認帳號與密碼");
        return;
      }
  
      // ✅ 一樣把 user 存起來，之後課程列表 / 聊天室要用 userId
      try {
        localStorage.setItem("coursify:user", JSON.stringify(data.user));
      } catch {
        console.warn("無法儲存使用者資訊");
      }
  
      alert(`歡迎回來，${data.user?.name ?? "同學"}`);
      // ✅ 登入後直接去課程列表或首頁，不經過選課
      router.push("/home"); // 或 "/home"
    } catch (error) {
      console.error(error);
      alert("網路或伺服器錯誤，請稍後再試");
    }
  }
  
  

  const accountId = "account";
  const passwordId = "password";
  const accountErrorId = `${accountId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[360px] px-6 sm:px-8 py-8">
        {/* Title */}
        <h1 className="mb-6 text-center text-3xl font-bold text-[#0B1015]">登入</h1>

        {/* Form */}
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {/* Account Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={accountId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <User className="h-4 w-4 text-[#3B82F6]" />
              學號
            </label>
            <input
              id={accountId}
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="輸入您的學號"
              aria-invalid={errors.account ? "true" : "false"}
              aria-describedby={errors.account ? accountErrorId : undefined}
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.account ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.account && (
              <span id={accountErrorId} className="text-sm text-[#ef4444]">
                {errors.account}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={passwordId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <Lock className="h-4 w-4 text-[#3B82F6]" />
              密碼
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入您的密碼"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? passwordErrorId : undefined}
                className={[
                  "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 pr-12 text-base",
                  "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                  errors.password ? "ring-2 ring-[#ef4444]" : "",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6b7280] transition-colors hover:text-[#0B1015] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 rounded"
                aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <span id={passwordErrorId} className="text-sm text-[#ef4444]">
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-2 h-14 w-full rounded-[14px] bg-[#3B82F6] text-[18px] font-semibold text-white transition-colors hover:bg-[#5091f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B82F6]"
          >
            下一步
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-[#6b7280]">
          還沒有帳號？{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#3B82F6] underline-offset-4 hover:underline"
          >
            立即註冊
          </Link>
        </p>
      </div>
    </PageShell>
  );
}