import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const userId = Number(userIdParam);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ message: "缺少或無效的 userId" }, { status: 400 });
    }

    const memos = await prisma.memo.findMany({
      where: { userId },
      orderBy: [{ dateISO: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ memos });
  } catch (error) {
    console.error("[GET /api/memos/my] error", error);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
