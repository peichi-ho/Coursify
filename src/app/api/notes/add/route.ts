// src/app/api/notes/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userId = Number(formData.get("userId"));
    const courseId = Number(formData.get("courseId"));
    const title = String(formData.get("title") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "").trim();
    const price = Number(priceRaw);
    const file = formData.get("file") as File | null;

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "缺少或無效的 userId" },
        { status: 400 }
      );
    }
    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json(
        { error: "缺少或無效的 courseId" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { error: "標題不可空白" },
        { status: 400 }
      );
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "售價必須是非負數字" },
        { status: 400 }
      );
    }

    // 🔴 檔案必填
    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "請上傳筆記檔案" },
        { status: 400 }
      );
    }

    // 檢查 user / course 存在
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }
    if (!course) {
      return NextResponse.json({ error: "找不到課程" }, { status: 404 });
    }

    // 處理檔案上傳（存到 public/uploads/notes）
    let fileUrl: string | null = null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "notes");
    await fs.mkdir(uploadDir, { recursive: true });

    const safeName =
      Date.now().toString() + "-" + file.name.replace(/\s+/g, "_");
    const filePath = path.join(uploadDir, safeName);

    await fs.writeFile(filePath, buffer);

    // 前端可以用這個 URL 開啟檔案
    fileUrl = `/uploads/notes/${safeName}`;

    const note = await prisma.note.create({
      data: {
        courseId,
        userId,
        title,
        price,
        fileUrl,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        note: {
          id: note.id,
          authorName: note.user.name,
          title: note.title,
          price: note.price,
          fileUrl: note.fileUrl,
          // 🔹 目前先用同一個網址當「試閱」示意
          previewUrl: note.fileUrl,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/notes/add error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
