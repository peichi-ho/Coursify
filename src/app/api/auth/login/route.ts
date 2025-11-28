// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { account, password } = await req.json();

    if (!account || !password) {
      return NextResponse.json(
        { message: "請輸入帳號與密碼" },
        { status: 400 }
      );
    }

    // 允許用 email 或 studentId 登入
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { studentId: account }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { message: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    // ⚠️ 千萬不要把 passwordHash 傳回去
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          points: user.points, // ⭐ 把點數一起回給前端
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/login error", error);
    return NextResponse.json(
      { message: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
