// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 連線字串由 prisma/schema.prisma 的 env("DATABASE_URL") 讀取。
// 不要在這裡手動傳 datasources：環境變數不存在時會傳入 undefined，
// PrismaClient 在模組載入時就丟錯，導致 Vercel build（收集頁面資料階段）失敗。
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
