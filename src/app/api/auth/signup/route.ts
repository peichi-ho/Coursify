import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const name = String(body.name ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const department = String(body.department ?? "").trim();
    const password = String(body.password ?? "");

    if (!name || !studentId || !email || !department || !password) {
      return NextResponse.json(
        { message: "所有欄位皆為必填" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "密碼需至少 8 個字元" },
        { status: 400 }
      );
    }

    // 檢查 email / 學號 是否已存在
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { studentId }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "此學號或電子郵件已註冊過" },
        { status: 409 }
      );
    }

    // 雜湊密碼
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        studentId,
        email,
        department,
        passwordHash,
      },
    });

    const { passwordHash: _ignored, ...safeUser } = created;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (e) {
    console.error("POST /api/auth/signup error", e);
    return NextResponse.json(
      { message: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
