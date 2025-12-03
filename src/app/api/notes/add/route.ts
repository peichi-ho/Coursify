// src/app/api/notes/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer"; // ⭐ 新增：改用 Supabase Storage

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

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "請上傳筆記檔案" },
        { status: 400 }
      );
    }

    // 檢查 user / course 是否存在
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

    // ⭐ 1) File -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ⭐ 2) 準備上傳路徑（存在 bucket 裡的相對路徑）
    const ext = file.name.split(".").pop() ?? "bin";
    const safeFilename = `${Date.now()}-${userId}.${ext}`;
    const storagePath = `notes/${safeFilename}`; // 存在 bucket "notes" 底下

    // ⭐ 3) 上傳到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer
      .storage
      .from("notes") // bucket 名稱
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error("Supabase upload error", uploadError);
      return NextResponse.json(
        { error: "檔案上傳失敗，請稍後再試" },
        { status: 500 }
      );
    }

    // ⭐ 4) 取得 public URL（或你也可以只存 path）
    const { data: publicUrlData } = supabaseServer
      .storage
      .from("notes")
      .getPublicUrl(uploadData.path);

    const fileUrl = publicUrlData.publicUrl;
    const fullFilePath = uploadData.path; // 如果你 schema 有 fullFilePath 可存這個

    // ⭐ 5) 寫入資料庫
    const note = await prisma.note.create({
      data: {
        courseId,
        userId,
        title,
        price,
        fileUrl,
        fullFilePath,
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
          // 目前先拿同一個網址當試閱
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
