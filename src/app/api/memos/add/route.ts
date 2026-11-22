import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => null);
    const title = String(body?.title ?? "").trim();
    const dateISO = String(body?.dateISO ?? "").trim();

    if (!title || !dateISO) {
      return NextResponse.json(
        { error: "缺少必要欄位 title / dateISO" },
        { status: 400 }
      );
    }

    const memo = await prisma.memo.create({
      data: { userId: auth, title, dateISO },
    });

    return NextResponse.json({ memo }, { status: 200 });
  } catch (err) {
    console.error("新增 memo 發生錯誤:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
