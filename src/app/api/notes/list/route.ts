// src/app/api/notes/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const courseIdRaw = searchParams.get("courseId");
    const courseId = Number(courseIdRaw);

    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json(
        { error: "缺少或無效的 courseId" },
        { status: 400 }
      );
    }

    const notes = await prisma.note.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        notes: notes.map((n) => ({
          id: n.id,
          authorName: n.user.name,
          title: n.title,
          price: n.price,
          fileUrl: n.fileUrl,
          // 🔹 給前端的 previewUrl，先用同一個檔案
          previewUrl: n.fileUrl,
        })),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /api/notes/list error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
