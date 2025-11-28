// src/app/api/courses/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { message: "缺少 userId" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { message: "userId 必須是數字" },
        { status: 400 }
      );
    }

    // 把這個 user 的選課全部撈出來，順便帶出對應的 course
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: {
        course: {
          name: "asc",
        },
      },
    });

    // 只回傳課程本身
    const courses = enrollments.map((e) => e.course);

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error("[COURSE MY] error =", error);
    return NextResponse.json(
      { message: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
