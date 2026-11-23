// src/app/api/notes/[id]/purchase/route.ts
// 購買筆記：在同一個 transaction 裡完成
//   1) 寫入購買紀錄（資料庫的唯一索引擋掉重複購買）
//   2) 買家扣點（條件式 UPDATE，避免並發超扣）
//   3) 賣家入帳
//   4) 雙方各留一筆點數紀錄
// 任何一步失敗，整筆交易都會回滾。
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deductPoints, InsufficientPointsError } from "@/lib/points";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const buyerId = auth;

  const noteId = Number((await context.params).id);
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return NextResponse.json({ error: "無效的筆記 ID" }, { status: 400 });
  }

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, price: true, userId: true },
  });
  if (!note) {
    return NextResponse.json({ error: "找不到此筆記" }, { status: 404 });
  }
  if (note.userId === buyerId) {
    return NextResponse.json({ error: "不能購買自己的筆記" }, { status: 400 });
  }
  if (note.price <= 0) {
    return NextResponse.json({ error: "免費筆記不需要購買" }, { status: 400 });
  }

  try {
    const points = await prisma.$transaction(async (tx) => {
      await tx.notePurchase.create({ data: { userId: buyerId, noteId } });

      const remaining = await deductPoints(tx, buyerId, note.price);

      await tx.user.update({
        where: { id: note.userId },
        data: { points: { increment: note.price } },
      });

      await tx.pointTransaction.createMany({
        data: [
          { userId: buyerId, type: "USE", amount: note.price, message: `購買筆記：${note.title}` },
          { userId: note.userId, type: "EARN", amount: note.price, message: `筆記售出：${note.title}` },
        ],
      });

      return remaining;
    });

    return NextResponse.json({ ok: true, points });
  } catch (e) {
    if (e instanceof InsufficientPointsError) {
      return NextResponse.json({ error: "點數不足" }, { status: 400 });
    }
    // P2002 = 違反唯一索引：這個人已經買過這份筆記（包含同時送出兩次的情況）
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "你已經購買過這份筆記" }, { status: 409 });
    }
    console.error("POST /api/notes/[id]/purchase error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
