// src/app/api/enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "缺少 request body" },
        { status: 400 }
      );
    }

    const userId = Number(body.userId);
    const courseName: string | undefined = body.courseName;
    const courseTeacher: string | null | undefined = body.courseTeacher;
    const weekday: string | null | undefined = body.weekday;
    const timeSlot: string | null | undefined = body.timeSlot;

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "userId 無效" },
        { status: 400 }
      );
    }

    if (!courseName || !courseName.trim()) {
      return NextResponse.json(
        { error: "課程名稱為必填" },
        { status: 400 }
      );
    }

    const nameTrimmed = courseName.trim();
    const teacherTrimmed =
      courseTeacher && courseTeacher.trim().length > 0
        ? courseTeacher.trim()
        : null;
    const weekdayTrimmed =
      weekday && weekday.trim().length > 0 ? weekday.trim() : null;
    const timeSlotTrimmed =
      timeSlot && timeSlot.trim().length > 0 ? timeSlot.trim() : null;

    // 1️⃣ 試著找是否已有相同條件的課程
    let course = await prisma.course.findFirst({
      where: {
        name: nameTrimmed,
        teacher: teacherTrimmed,
        weekday: weekdayTrimmed,
        timeSlot: timeSlotTrimmed,
      },
    });

    // 2️⃣ 沒有就新建一個
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: nameTrimmed,
          teacher: teacherTrimmed,
          weekday: weekdayTrimmed,
          timeSlot: timeSlotTrimmed,
        },
      });
    }

    // 3️⃣ 建立選課紀錄
    try {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: course.id,
        },
      });

      return NextResponse.json({ enrollment });
    } catch (e: any) {
      console.error("create enrollment error", e);
      // 可能已經選過這門課（因為 @@unique）
      return NextResponse.json(
        { error: "可能已經選過這門課" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("POST /api/enrollments error", e);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
