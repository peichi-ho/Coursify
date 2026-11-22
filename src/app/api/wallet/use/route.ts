// src/app/api/wallet/use/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Body = {
  amount: number;   // 要扣的點數
  message?: string; // 例如「購買筆記：期中考總整理」
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as Partial<Body>;
    const userId = auth;
    const amount = Number(body.amount || 0);
    const message = (body.message ?? "").toString();

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "amount 不合法" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      if (user.points < amount) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          points: user.points - amount,
        },
      });

      const txRecord = await tx.pointTransaction.create({
        data: {
          userId,
          type: "USE",
          amount,
          message,
        },
      });

      return { updated, txRecord };
    });

    return NextResponse.json({
      points: result.updated.points,
      transaction: {
        id: result.txRecord.id,
        amount: result.txRecord.amount,
        message: result.txRecord.message ?? "",
        dateISO: result.txRecord.createdAt.toISOString(),
        type: "USE",
      },
    });
  } catch (e: any) {
    console.error("wallet/use error", e);
    if (e?.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (e?.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json(
        { error: "點數不足" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
