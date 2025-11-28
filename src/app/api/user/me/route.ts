// src/app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 共用的 select，避免把 passwordHash 傳給前端
const userSelect = {
  id: true,
  name: true,
  studentId: true,
  email: true,
  department: true,
  points: true,
  enrollments: {
    include: {
      course: true,
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const userId = Number(userIdParam);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "缺少或無效的 userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json(
        { error: "找不到使用者" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (e) {
    console.error("GET /api/user/me error", e);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "缺少 request body" },
        { status: 400 }
      );
    }

    const userId = Number(body.userId);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "缺少或無效的 userId" },
        { status: 400 }
      );
    }

    const {
      name,
      department,
      oldPassword,
      newPassword,
    }: {
      name?: string;
      department?: string;
      oldPassword?: string;
      newPassword?: string;
    } = body;

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "找不到使用者" },
        { status: 404 }
      );
    }

    const data: any = {};
    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }
    if (typeof department === "string") {
      data.department = department.trim();
    }

    // 如果要改密碼 → 檢查舊密碼
    if (typeof newPassword === "string" && newPassword.length > 0) {
      if (!oldPassword) {
        return NextResponse.json(
          { error: "請輸入舊密碼" },
          { status: 400 }
        );
      }

      const match = await bcrypt.compare(
        oldPassword,
        existing.passwordHash
      );
      if (!match) {
        return NextResponse.json(
          { error: "舊密碼不正確" },
          { status: 400 }
        );
      }

      const hash = await bcrypt.hash(newPassword, 10);
      data.passwordHash = hash;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "沒有任何可更新欄位" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    console.error("PATCH /api/user/me error", e);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
