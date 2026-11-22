import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const memos = await prisma.memo.findMany({
    where: { userId: auth },
    orderBy: { dateISO: "asc" },
  });

  return NextResponse.json({ memos });
}
