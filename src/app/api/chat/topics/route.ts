// src/app/api/chat/topics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 取得某堂課的所有主題列表
 * GET /api/chat/topics?courseId=123
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseIdRaw = searchParams.get("courseId");
    const courseId = Number(courseIdRaw);

    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json(
        { message: "缺少或無效的 courseId" },
        { status: 400 }
      );
    }

    const topics = await prisma.chatTopic.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const result = topics.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      authorName: t.author.name,
      createdAt: t.createdAt,
      lastMessage: t.messages[0]?.text ?? null,
    }));

    return NextResponse.json({ topics: result }, { status: 200 });
  } catch (e) {
    console.error("GET /api/chat/topics error", e);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}

/**
 * 新增一個主題
 * POST /api/chat/topics
 * body: { courseId, userId, title, content }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const courseId = Number(body.courseId);
    const authorId = Number(body.userId);
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json(
        { message: "缺少或無效的 courseId" },
        { status: 400 }
      );
    }
    if (!authorId || Number.isNaN(authorId)) {
      return NextResponse.json(
        { message: "缺少或無效的 userId" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { message: "標題不可空白" },
        { status: 400 }
      );
    }

    const topic = await prisma.chatTopic.create({
      data: {
        courseId,
        authorId,
        title,
        content,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (e) {
    console.error("POST /api/chat/topics error", e);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
