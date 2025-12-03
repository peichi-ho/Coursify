// src/app/api/enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ 把老師名字統一格式：逗號→頓號、去空白、排序
function normalizeTeacher(raw: string | null | undefined): string | null {
  if (!raw) return null;

  return raw
  // eslint-disable-next-line no-misleading-character-class
    .replace(/[，,]/g, "、") // 全部中文逗號/英文逗號換成頓號
    .split("、")             // 依頓號切開
    .map((s) => s.trim())    // 去掉前後空白
    .filter(Boolean)         // 移除空字串
    .sort()                  // 排序，消除輸入順序影響
    .join("、");             // 再組回一個字串
}

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

    // ✅ 老師名字先做正規化（包含 trim + 排序）
    const teacherNormalized = normalizeTeacher(courseTeacher);

    const weekdayTrimmed =
      weekday && weekday.trim().length > 0 ? weekday.trim() : null;

    const timeSlotTrimmed =
      timeSlot && timeSlot.trim().length > 0 ? timeSlot.trim() : null;

    // 1️⃣ 試著找是否已有相同條件的課程
    let course = await prisma.course.findFirst({
      where: {
        name: nameTrimmed,
        teacher: teacherNormalized,
        weekday: weekdayTrimmed,
        timeSlot: timeSlotTrimmed,
      },
    });

    // 2️⃣ 沒有就新建一個
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: nameTrimmed,
          teacher: teacherNormalized,
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
