// src/lib/auth.ts
// 登入狀態改由後端判斷：登入成功後發一個簽章過的 httpOnly cookie，
// API 一律從 cookie 取得「現在是誰」，不再相信前端傳來的 userId。
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "coursify_session";
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET 未設定或長度不足 32 字元");
  }
  return new TextEncoder().encode(secret);
}

/** 登入 / 註冊成功時呼叫：把 userId 簽章後寫進 httpOnly cookie */
export async function setSession(res: NextResponse, userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // 前端 JS 讀不到，降低被 XSS 偷走的風險
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** 讀取 cookie 並驗證簽章；沒登入或被竄改就回傳 null */
export async function getSessionUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * API 開頭使用：
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const userId = auth;
 */
export async function requireUser(): Promise<number | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  return userId;
}
