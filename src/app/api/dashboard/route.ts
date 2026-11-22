// src/app/api/dashboard/route.ts
// 首頁一次拿齊需要的資料：使用者、已選課程、即將到來的提醒、所選課程的最新筆記。
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function todayISO(): string {
  // 以台灣時間判斷「今天」，避免部署在 UTC 主機上時日期差一天
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(new Date());
}

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const [user, enrollments, upcoming, memoCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, points: true },
      }),
      prisma.enrollment.findMany({
        where: { userId },
        include: { course: true },
        orderBy: { course: { name: "asc" } },
      }),
      prisma.memo.findMany({
        where: { userId, dateISO: { gte: todayISO() } },
        orderBy: [{ dateISO: "asc" }, { createdAt: "asc" }],
        take: 5,
      }),
      prisma.memo.count({ where: { userId, dateISO: { gte: todayISO() } } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }

    const courseIds = enrollments.map((e) => e.courseId);
    const notes = courseIds.length
      ? await prisma.note.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            user: { select: { name: true } },
            course: { select: { id: true, name: true } },
          },
        })
      : [];

    // 每門課的討論主題數，首頁課程卡片用
    const topicCounts = courseIds.length
      ? await prisma.chatTopic.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
        })
      : [];
    const topicsByCourse = new Map(topicCounts.map((t) => [t.courseId, t._count._all]));

    return NextResponse.json({
      user,
      today: todayISO(),
      courses: enrollments.map((e) => ({
        id: e.course.id,
        name: e.course.name,
        teacher: e.course.teacher,
        weekday: e.course.weekday,
        timeSlot: e.course.timeSlot,
        topicCount: topicsByCourse.get(e.course.id) ?? 0,
      })),
      upcoming: upcoming.map((m) => ({ id: m.id, title: m.title, dateISO: m.dateISO })),
      upcomingCount: memoCount,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        price: n.price,
        authorName: n.user.name,
        courseId: n.course.id,
        courseName: n.course.name,
        hasFile: Boolean(n.fileUrl),
      })),
    });
  } catch (e) {
    console.error("GET /api/dashboard error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
