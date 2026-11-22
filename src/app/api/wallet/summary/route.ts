// src/app/api/wallet/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      department: true,
      points: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const txs = await prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const earnRecords = txs
    .filter((t) => t.type === "EARN")
    .map((t) => ({
      id: t.id,
      message: t.message ?? "",
      amount: t.amount,
      dateISO: t.createdAt.toISOString(),
    }));

  const useRecords = txs
    .filter((t) => t.type === "USE")
    .map((t) => ({
      id: t.id,
      message: t.message ?? "",
      amount: t.amount,
      dateISO: t.createdAt.toISOString(),
    }));

  return NextResponse.json({
    user,
    points: user.points,
    earnRecords,
    useRecords,
  });
}
