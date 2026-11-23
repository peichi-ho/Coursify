// src/app/api/notes/list/route.ts
// 筆記列表。不回傳檔案網址：要看檔案請呼叫 /api/notes/[id]/file，
// 後端會檢查是不是作者、已購買或免費筆記。
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const courseId = Number(new URL(req.url).searchParams.get("courseId"));
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: "缺少或無效的 courseId" }, { status: 400 });
    }

    const notes = await prisma.note.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
        purchases: { where: { userId }, select: { id: true } },
      },
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        authorName: n.user.name,
        title: n.title,
        price: n.price,
        hasFile: Boolean(n.fullFilePath),
        soldCount: n._count.purchases,
        isMine: n.userId === userId,
        purchased: n.purchases.length > 0,
      })),
    });
  } catch (e) {
    console.error("GET /api/notes/list error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
