// src/app/api/wallet/summary/route.ts
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");

  if (!userIdParam) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const userId = Number(userIdParam);
  if (Number.isNaN(userId)) {
    return NextResponse.json(
      { error: "userId must be a number" },
      { status: 400 }
    );
  }

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
