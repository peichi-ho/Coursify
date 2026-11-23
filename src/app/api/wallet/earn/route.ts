// src/app/api/wallet/earn/route.ts
// 模擬儲值（尚未串接金流）。
// 原本「加幾點」由前端決定，登入後可以自己加任意點數；
// 現在只接受固定方案，點數與紀錄文字都由後端決定。
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const TOP_UP_PLANS: Record<number, { label: string; price: number }> = {
  10: { label: "X10", price: 10 },
  20: { label: "X20", price: 20 },
  40: { label: "X40", price: 25 },
  50: { label: "X50", price: 40 },
  100: { label: "X100", price: 80 },
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount ?? 0);
  const plan = TOP_UP_PLANS[amount];
  if (!plan) {
    return NextResponse.json({ error: "無效的儲值方案" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 用 increment 讓資料庫做加法；「先讀再寫回」在同時儲值時會少加
      const updated = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { points: true },
      });
      const txRecord = await tx.pointTransaction.create({
        data: {
          userId,
          type: "EARN",
          amount,
          message: `購買點數方案 ${plan.label}（${plan.price}元，模擬儲值）`,
        },
      });
      return { points: updated.points, txRecord };
    });

    return NextResponse.json({
      points: result.points,
      transaction: {
        id: result.txRecord.id,
        amount: result.txRecord.amount,
        message: result.txRecord.message ?? "",
        dateISO: result.txRecord.createdAt.toISOString(),
        type: "EARN",
      },
    });
  } catch (e) {
    console.error("wallet/earn error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
