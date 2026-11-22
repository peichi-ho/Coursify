import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  // Next 16: params 是 Promise，要先拿出來
  const { id } = await context.params;
  const enrollmentId = Number(id);
  if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
    return NextResponse.json({ error: "無效的選課 ID" }, { status: 400 });
  }

  try {
    // 只能退選自己的課
    const { count } = await prisma.enrollment.deleteMany({
      where: { id: enrollmentId, userId: auth },
    });
    if (count === 0) {
      return NextResponse.json({ error: "找不到此選課紀錄" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("退選失敗", e);
    return NextResponse.json({ error: "退選失敗" }, { status: 500 });
  }
}
