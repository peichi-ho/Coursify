// src/app/notes/[courseId]/page.tsx — 筆記市集（指定課程）
"use client";
import { useParams } from "next/navigation";
import NotesMarket from "@/components/NotesMarket";

export default function CourseNotesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  return <NotesMarket initialCourseId={Number(courseId)} />;
}
