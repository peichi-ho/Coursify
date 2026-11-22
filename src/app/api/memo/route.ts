// app/api/memo/route.ts
// 更新 / 刪除單筆 memo。新增走 /api/memos/add。
// 只能動自己的 memo：where 條件同時比對 id 與 userId，不是自己的就回 404。
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function parseMemoId(req: NextRequest): number | null {
  const idParam = new URL(req.url).searchParams.get("id");
  const memoId = Number(idParam);
  return Number.isInteger(memoId) && memoId > 0 ? memoId : null;
}

/** 更新某一筆 memo：PATCH /api/memo?id=1 */
export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const memoId = parseMemoId(req);
  if (!memoId) {
    return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
  }

  try {
    const { title, dateISO } = (await req.json()) as {
      title?: string;
      dateISO?: string;
    };
    if (!title || !dateISO) {
      return NextResponse.json({ message: "缺少欄位" }, { status: 400 });
    }

    const { count } = await prisma.memo.updateMany({
      where: { id: memoId, userId: auth },
      data: { title, dateISO },
    });
    if (count === 0) {
      return NextResponse.json({ message: "找不到此 memo" }, { status: 404 });
    }

    const memo = await prisma.memo.findUnique({ where: { id: memoId } });
    return NextResponse.json({ memo });
  } catch (error) {
    console.error("PATCH /api/memo error", error);
    return NextResponse.json({ message: "更新失敗" }, { status: 500 });
  }
}

/** 刪除某一筆 memo：DELETE /api/memo?id=1 */
export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const memoId = parseMemoId(req);
  if (!memoId) {
    return NextResponse.json({ message: "無效的 memo id" }, { status: 400 });
  }

  try {
    const { count } = await prisma.memo.deleteMany({
      where: { id: memoId, userId: auth },
    });
    if (count === 0) {
      return NextResponse.json({ message: "找不到此 memo" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/memo error", error);
    return NextResponse.json({ message: "刪除失敗" }, { status: 500 });
  }
}
