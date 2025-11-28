// app/api/memo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * （如果你有用到，可以保留 create 用的 POST；
 * 目前新增是走 /api/memos/add 也沒關係）
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, title, dateISO } = await req.json();

    if (!userId || !title || !dateISO) {
      return NextResponse.json({ message: "缺少欄位" }, { status: 400 });
    }

    const memo = await prisma.memo.create({
      data: {
        userId: Number(userId),
        title,
        dateISO,
      },
    });

    return NextResponse.json({ memo }, { status: 201 });
  } catch (error) {
    console.error("POST /api/memo error", error);
    return NextResponse.json({ message: "新增失敗" }, { status: 500 });
  }
}

/**
 * 更新某一筆 memo：PATCH /api/memo?id=1
 */
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const memoId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(memoId)) {
      return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
    }

    const { title, dateISO } = (await req.json()) as {
      title?: string;
      dateISO?: string;
    };

    if (!title || !dateISO) {
      return NextResponse.json({ message: "缺少欄位" }, { status: 400 });
    }

    const memo = await prisma.memo.update({
      where: { id: memoId },
      data: { title, dateISO },
    });

    return NextResponse.json({ memo });
  } catch (error) {
    console.error("PATCH /api/memo error", error);
    return NextResponse.json({ message: "更新失敗" }, { status: 500 });
  }
}

/**
 * 刪除某一筆 memo：DELETE /api/memo?id=1
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const memoId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(memoId)) {
      return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
    }

    await prisma.memo.delete({
      where: { id: memoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/memo error", error);
    return NextResponse.json({ message: "刪除失敗" }, { status: 500 });
  }
}
