// src/app/api/notes/by-course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseIdRaw = searchParams.get("courseId");
  const courseId = Number(courseIdRaw);

  if (!courseId || Number.isNaN(courseId)) {
    return NextResponse.json(
      { message: "缺少或無效的 courseId" },
      { status: 400 }
    );
  }

  const notes = await prisma.note.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        price: n.price,
        authorName: n.user.name,
        createdAt: n.createdAt,
        fileUrl: n.fileUrl,
        // 一樣先用同一個網址當示意
        previewUrl: n.fileUrl,
      })),
    },
    { status: 200 }
  );
}
