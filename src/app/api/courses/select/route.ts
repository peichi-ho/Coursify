import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingCourse = {
  name: string;
  teacher?: string | null;
  weekday?: string | null;
  timeSlot?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { userId, courses } = (await req.json()) as {
      userId: number;
      courses: IncomingCourse[];
    };

    if (!userId || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: "缺少 userId 或 courses" },
        { status: 400 }
      );
    }

    // 確認 user 存在
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { message: "找不到此使用者" },
        { status: 404 }
      );
    }

    const savedCourses = [];

    for (const c of courses) {
      const name = c.name?.trim();
      if (!name) continue;

      const teacher = c.teacher?.trim() || null;
      const weekday = c.weekday?.trim() || null;
      const timeSlot = c.timeSlot?.trim() || null;

      // 這邊簡單用「課名 + 老師 + 星期 + 節次」來判斷是不是同一堂課
      let course = await prisma.course.findFirst({
        where: {
          name,
          teacher,
          weekday,
          timeSlot,
        },
      });

      // 如果資料庫還沒有這堂課，就建立一個
      if (!course) {
        course = await prisma.course.create({
          data: {
            name,
            teacher,
            weekday,
            timeSlot,
          },
        });
      }

      // 建立/維持選課關係
      await prisma.enrollment.upsert({
        where: {
          user_course_unique: {
            userId,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          userId,
          courseId: course.id,
        },
      });

      savedCourses.push(course);
    }

    return NextResponse.json(
      { message: "選課儲存成功", courses: savedCourses },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COURSE SELECT] error =", error);
    return NextResponse.json(
      { message: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
