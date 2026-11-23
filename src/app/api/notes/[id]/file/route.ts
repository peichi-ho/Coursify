// src/app/api/notes/[id]/file/route.ts
// 取得筆記檔案的暫時網址。只有作者、已購買者，或免費筆記才拿得到。
// 用 Supabase Storage 的簽名網址（60 秒後失效），不再把永久的公開網址交給前端。
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseServer";

const SIGNED_URL_SECONDS = 60;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const noteId = Number((await context.params).id);
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return NextResponse.json({ error: "無效的筆記 ID" }, { status: 400 });
  }

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { userId: true, price: true, fullFilePath: true },
  });
  if (!note) {
    return NextResponse.json({ error: "找不到此筆記" }, { status: 404 });
  }

  const canAccess =
    note.userId === userId ||
    note.price <= 0 ||
    (await prisma.notePurchase.findUnique({
      where: { user_note_unique: { userId, noteId } },
      select: { id: true },
    })) !== null;

  if (!canAccess) {
    return NextResponse.json({ error: "購買後才能查看完整筆記" }, { status: 403 });
  }
  if (!note.fullFilePath) {
    return NextResponse.json({ error: "此筆記沒有上傳檔案" }, { status: 404 });
  }

  const { data, error } = await getSupabaseServer()
    .storage.from("notes")
    .createSignedUrl(note.fullFilePath, SIGNED_URL_SECONDS);

  if (error || !data) {
    console.error("createSignedUrl error", error);
    return NextResponse.json({ error: "無法取得檔案" }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_SECONDS });
}
