"use client";

import { useState } from "react";
import Link from "next/link";
import { User, GraduationCap, Mail, Grid, Lock } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useRouter } from "next/navigation";


type Errors = {
  name?: string;
  studentId?: string;
  email?: string;
  department?: string;
  password?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): boolean {
    const next: Errors = {};

    if (!name.trim()) {
      next.name = "請輸入姓名";
    }

    if (!studentId.trim()) {
      next.studentId = "請輸入學號";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      next.email = "請輸入電子郵件帳號";
    } else if (!emailRegex.test(email)) {
      next.email = "請輸入有效的電子郵件";
    }

    if (!department.trim()) {
      next.department = "請輸入系級";
    }

    if (!password.trim()) {
      next.password = "請輸入密碼";
    } else if (password.length < 8) {
      next.password = "密碼需至少 8 個字元";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
  
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          studentId,
          email,
          department,
          password,
        }),
      });
  
      const data = await res.json().catch(() => null);
  
      if (!res.ok) {
        alert(data?.message ?? "註冊失敗，請稍後再試");
        return;
      }
  
      // ✅ 把剛註冊的 user 存起來（之後選課會用到 user.id）
      try {
        localStorage.setItem("coursify:user", JSON.stringify(data.user));
      } catch {
        console.warn("無法儲存使用者資訊");
      }
  
      alert("註冊成功！接下來請選擇本學期課程");
      // ✅ 註冊後直接進「選課」頁面
      router.push("/selectcourse");
    } catch (error) {
      console.error(error);
      alert("網路或伺服器錯誤，請稍後再試");
    }
  }
  
  

  const nameId = "name";
  const studentIdId = "studentId";
  const emailId = "email";
  const departmentId = "department";
  const passwordId = "password";

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[360px] px-6 sm:px-8 py-8">
        {/* Title */}
        <h1 className="mb-6 text-center text-3xl font-bold text-[#0B1015]">
          註冊
        </h1>

        {/* Form */}
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {/* Name Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={nameId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <User className="h-4 w-4 text-[#3B82F6]" />
              姓名
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入您的姓名"
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={
                errors.name ? `${nameId}-error` : undefined
              }
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.name ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.name && (
              <span
                id={`${nameId}-error`}
                className="text-sm text-[#ef4444]"
              >
                {errors.name}
              </span>
            )}
          </div>

          {/* Student ID Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={studentIdId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <GraduationCap className="h-4 w-4 text-[#3B82F6]" />
              學號
            </label>
            <input
              id={studentIdId}
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="輸入您的學號"
              aria-invalid={errors.studentId ? "true" : "false"}
              aria-describedby={
                errors.studentId ? `${studentIdId}-error` : undefined
              }
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.studentId ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.studentId && (
              <span
                id={`${studentIdId}-error`}
                className="text-sm text-[#ef4444]"
              >
                {errors.studentId}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={emailId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <Mail className="h-4 w-4 text-[#3B82F6]" />
              電子郵件帳號
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入您的電子郵件帳號"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={
                errors.email ? `${emailId}-error` : undefined
              }
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.email ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.email && (
              <span
                id={`${emailId}-error`}
                className="text-sm text-[#ef4444]"
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* Department Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={departmentId}
              className="flex items-center gap-2 text-sm font-medium text-[#0B1015]"
            >
              <Grid className="h-4 w-4 text-[#3B82F6]" />
              系級
            </label>
            <input
              id={departmentId}
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="輸入您的系級"
              aria-invalid={errors.department ? "true" : "false"}
              aria-describedby={
                errors.department ? `${departmentId}-error` : undefined
              }
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg-white px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.department ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.department && (
              <span
                id={`${departmentId}-error`}
                className="text-sm text-[#ef4444]"
              >
                {errors.department}
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
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入您的密碼"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={
                errors.password ? `${passwordId}-error` : undefined
              }
              className={[
                "h-12 w-full rounded-[14px] border border-transparent bg白 px-4 text-base",
                "shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3B82F6]",
                errors.password ? "ring-2 ring-[#ef4444]" : "",
              ].join(" ")}
            />
            {errors.password && (
              <span
                id={`${passwordId}-error`}
                className="text-sm text-[#ef4444]"
              >
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
          已有帳號？{" "}
          <Link
            href="/login"
            className="font-semibold text-[#3B82F6] underline-offset-4 hover:underline"
          >
            立即登入
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
