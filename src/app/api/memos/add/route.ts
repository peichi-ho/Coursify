import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, dateISO } = body;

    if (!userId || !title || !dateISO) {
      return NextResponse.json(
        { error: "缺少必要欄位 userId / title / dateISO" },
        { status: 400 }
      );
    }

    const memo = await prisma.memo.create({
      data: { userId, title, dateISO }
    });

    return NextResponse.json({ memo }, { status: 200 });
  } catch (err) {
    console.error("新增 memo 發生錯誤:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
