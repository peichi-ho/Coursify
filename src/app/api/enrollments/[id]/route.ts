// src/app/api/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const enrollmentId = Number(context.params.id);
    if (!enrollmentId || Number.isNaN(enrollmentId)) {
      return NextResponse.json(
        { error: "無效的 enrollment id" },
        { status: 400 }
      );
    }

    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/enrollments/[id] error", e);
    return NextResponse.json(
      { error: "退選失敗，可能找不到這筆選課" },
      { status: 400 }
    );
  }
}
