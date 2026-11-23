// src/lib/points.ts
import type { Prisma } from "@prisma/client";

export class InsufficientPointsError extends Error {
  constructor() {
    super("INSUFFICIENT_POINTS");
  }
}

/**
 * 在 transaction 內扣點。
 *
 * 不能用「先讀餘額 → 在程式裡判斷 → 寫回 餘額 - 金額」：多個請求同時進來時，
 * 每個都會讀到同一個舊餘額、都判斷「夠」，最後只扣一次錢卻成功好幾次。
 * （scripts/concurrency-test.mjs 在舊寫法下 10 次有 9 次重現）
 *
 * 改成把「餘額夠不夠」寫進 UPDATE 的 WHERE 條件，讓資料庫一次完成判斷與扣款：
 *   UPDATE "User" SET points = points - $amount WHERE id = $id AND points >= $amount
 * PostgreSQL 會鎖住這一列，後到的請求等前一個完成後，用「新的餘額」重新判斷條件。
 */
export async function deductPoints(
  tx: Prisma.TransactionClient,
  userId: number,
  amount: number
): Promise<number> {
  const { count } = await tx.user.updateMany({
    where: { id: userId, points: { gte: amount } },
    data: { points: { decrement: amount } },
  });
  if (count === 0) throw new InsufficientPointsError();

  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { points: true },
  });
  return user.points;
}
