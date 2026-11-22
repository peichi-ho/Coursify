// src/app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * 取得單一主題內容 + 所有留言
 * GET /api/chat/messages?topicId=123
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const topicIdRaw = searchParams.get("topicId");
    const topicId = Number(topicIdRaw);

    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json(
        { message: "缺少或無效的 topicId" },
        { status: 400 }
      );
    }

    const topic = await prisma.chatTopic.findUnique({
      where: { id: topicId },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { message: "找不到此主題" },
        { status: 404 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { topicId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          content: topic.content,
          authorId: topic.author.id,   // ⭐ 主題發文者
          authorName: topic.author.name,
          createdAt: topic.createdAt,
        },
        messages: messages.map((m) => ({
          id: m.id,
          text: m.text,
          authorId: m.author.id,        // ⭐ 留言者 id
          authorName: m.author.name,
          createdAt: m.createdAt,
          rewardedByAuthor: m.rewardedByAuthor, // ⭐ 有沒有被獎勵
        })),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /api/chat/messages error", e);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}

/**
 * 在主題底下新增留言
 * POST /api/chat/messages
 * body: { topicId, text }（留言者由登入狀態決定）
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const topicId = Number(body.topicId);
    const authorId = auth;
    const text = String(body.text ?? "").trim();

    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json(
        { message: "缺少或無效的 topicId" },
        { status: 400 }
      );
    }
    if (!text) {
      return NextResponse.json(
        { message: "內容不可空白" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        topicId,
        authorId,
        text,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          text: message.text,
          authorId: message.author.id,
          authorName: message.author.name,
          createdAt: message.createdAt,
          rewardedByAuthor: message.rewardedByAuthor,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/chat/messages error", e);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}

/**
 * 主題發文者獎勵某則留言
 * PATCH /api/chat/messages
 * body: { messageId, topicId }（給獎勵的人由登入狀態決定）
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const messageId = Number(body.messageId);
    const topicId = Number(body.topicId);
    const giverUserId = auth; // 按星星的人，必須是 topic 發文者

    if (!messageId || Number.isNaN(messageId)) {
      return NextResponse.json(
        { message: "缺少或無效的 messageId" },
        { status: 400 }
      );
    }
    if (!topicId || Number.isNaN(topicId)) {
      return NextResponse.json(
        { message: "缺少或無效的 topicId" },
        { status: 400 }
      );
    }

    // 找到留言 + 所屬主題 + 發文者
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        topic: { select: { id: true, authorId: true } },
      },
    });

    if (!message || message.topicId !== topicId) {
      return NextResponse.json(
        { message: "找不到此留言" },
        { status: 404 }
      );
    }

    // 只有這個 topic 的作者可以給獎勵
    if (message.topic.authorId !== giverUserId) {
      return NextResponse.json(
        { message: "只有主題發文者可以給獎勵" },
        { status: 403 }
      );
    }

    // 不能獎勵自己的留言（否則可以在自己的主題下留言、自己按星星刷點數）
    if (message.authorId === giverUserId) {
      return NextResponse.json(
        { message: "不能獎勵自己的留言" },
        { status: 400 }
      );
    }

    // 已經給過獎勵就不能重複
    if (message.rewardedByAuthor) {
      return NextResponse.json(
        { message: "此留言已獲得獎勵" },
        { status: 400 }
      );
    }

    const REWARD_POINTS = 5;

    // 用 transaction 確保三件事一起成功：
    // 1) 把這則留言標記 rewardedByAuthor = true
    // 2) 留言作者 user.points += 5
    // 3) 新增一筆 PointTransaction
    const result = await prisma.$transaction(async (tx) => {
      // 只在「尚未被獎勵」時才更新；同時送出兩次時，第二次 count 會是 0
      const { count } = await tx.chatMessage.updateMany({
        where: { id: messageId, rewardedByAuthor: false },
        data: { rewardedByAuthor: true },
      });
      if (count === 0) throw new Error("ALREADY_REWARDED");
      const updatedMsg = { id: messageId, rewardedByAuthor: true };

      const updatedUser = await tx.user.update({
        where: { id: message.authorId },
        data: { points: { increment: REWARD_POINTS } },
      });

      await tx.pointTransaction.create({
        data: {
          userId: updatedUser.id,
          type: "EARN",
          amount: REWARD_POINTS,
          message: "留言獲得主題發文者的星星獎勵",
        },
      });

      return { updatedMsg, updatedUser };
    });

    return NextResponse.json(
      {
        message: {
          id: result.updatedMsg.id,
          rewardedByAuthor: result.updatedMsg.rewardedByAuthor,
        },
        newUserPoints: result.updatedUser.points,
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_REWARDED") {
      return NextResponse.json(
        { message: "此留言已獲得獎勵" },
        { status: 400 }
      );
    }
    console.error("PATCH /api/chat/messages error", e);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
