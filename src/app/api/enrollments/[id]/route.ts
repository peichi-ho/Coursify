import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Next 16: params 是 Promise，要先拿出來
  const { id } = await context.params;

  const enrollmentId = Number(id);
  if (!enrollmentId || Number.isNaN(enrollmentId)) {
    return NextResponse.json({ error: "無效的選課 ID" }, { status: 400 });
  }

  try {
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("退選失敗", e);
    return NextResponse.json({ error: "退選失敗" }, { status: 500 });
  }
}
