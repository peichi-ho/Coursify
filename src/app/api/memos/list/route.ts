import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));

  if (!userId) {
    return NextResponse.json(
      { error: "缺少 userId" },
      { status: 400 }
    );
  }

  const memos = await prisma.memo.findMany({
    where: { userId },
    orderBy: { dateISO: "asc" }
  });

  return NextResponse.json({ memos });
}
