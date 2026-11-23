// src/app/api/wallet/use/route.ts
// 通用扣點。購買筆記請改用 /api/notes/[id]/purchase（會同時寫購買紀錄與賣家入帳）。
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deductPoints, InsufficientPointsError } from "@/lib/points";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount ?? 0);
  const message = String(body?.message ?? "").slice(0, 200);

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount 不合法" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const points = await deductPoints(tx, userId, amount);
      const txRecord = await tx.pointTransaction.create({
        data: { userId, type: "USE", amount, message },
      });
      return { points, txRecord };
    });

    return NextResponse.json({
      points: result.points,
      transaction: {
        id: result.txRecord.id,
        amount: result.txRecord.amount,
        message: result.txRecord.message ?? "",
        dateISO: result.txRecord.createdAt.toISOString(),
        type: "USE",
      },
    });
  } catch (e) {
    if (e instanceof InsufficientPointsError) {
      return NextResponse.json({ error: "點數不足" }, { status: 400 });
    }
    console.error("wallet/use error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
