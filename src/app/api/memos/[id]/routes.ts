import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

// 更新某一筆 memo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  const memoId = Number(params.id);

  if (!Number.isFinite(memoId)) {
    return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, dateISO } = body as { title?: string; dateISO?: string };

    if (!title || !dateISO) {
      return NextResponse.json({ message: "缺少欄位" }, { status: 400 });
    }

    const memo = await prisma.memo.update({
      where: { id: memoId },
      data: { title, dateISO },
    });

    return NextResponse.json({ memo });
  } catch (error) {
    console.error("PATCH /api/memos/[id] error", error);
    return NextResponse.json(
      { message: "更新失敗" },
      { status: 500 }
    );
  }
}

// 刪除某一筆 memo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  const memoId = Number(params.id);

  if (!Number.isFinite(memoId)) {
    return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
  }

  try {
    await prisma.memo.delete({
      where: { id: memoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/memos/[id] error", error);
    return NextResponse.json(
      { message: "刪除失敗" },
      { status: 500 }
    );
  }
}
