// scripts/concurrency-test.mjs
// 點數與筆記購買的整合測試，重點是「同時送出多個請求」時資料是否正確。
//
// 用法（先在另一個終端機執行 npm run dev）：
//   node scripts/concurrency-test.mjs
//   node scripts/concurrency-test.mjs --requests 10
//
// 會在資料庫建立測試帳號（email 結尾 @example.test）與測試筆記。
// 只允許對本機網站執行，避免在正式網站留下測試資料。

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--requests") + 1]) || 5;

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error(`只允許對本機執行，目前 BASE_URL = ${BASE}`);
  process.exit(1);
}

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) passed++;
  else failed++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `（${detail}）` : ""}`);
}

/** 每個測試帳號一個 client，自動帶上自己的登入 cookie */
function client() {
  let cookie = "";
  return async (path, { method = "GET", body, form } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(form ? {} : { "Content-Type": "application/json" }),
        ...(cookie && { Cookie: cookie }),
      },
      body: form ?? (body && JSON.stringify(body)),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    return { status: res.status, data: await res.json().catch(() => null) };
  };
}

async function newUser(label) {
  const api = client();
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const { status } = await api("/api/auth/signup", {
    method: "POST",
    body: {
      name: `test ${label}`,
      studentId: `ct${label}${suffix}`,
      email: `ct-${label}-${suffix}@example.test`,
      department: "test",
      password: `Test-${suffix}`,
    },
  });
  if (status !== 201) throw new Error(`註冊測試帳號失敗：${status}`);
  return api;
}

const points = async (api) => (await api("/api/wallet/summary")).data;

async function uploadNote(api, courseId, title, price) {
  const form = new FormData();
  form.append("courseId", String(courseId));
  form.append("title", title);
  form.append("price", String(price));
  form.append("file", new Blob([`test note: ${title}`], { type: "text/plain" }), "note.txt");
  const { status, data } = await api("/api/notes/add", { method: "POST", form });
  if (status !== 201) throw new Error(`上傳測試筆記失敗：${status} ${JSON.stringify(data)}`);
  return data.note.id;
}

async function testWalletUse() {
  console.log(`\n== 1. 通用扣點：餘額 10 點，同時送出 ${N} 個「扣 10 點」`);
  const user = await newUser("wallet");
  await user("/api/wallet/earn", { method: "POST", body: { amount: 10 } });
  const results = await Promise.all(
    Array.from({ length: N }, () => user("/api/wallet/use", { method: "POST", body: { amount: 10 } }))
  );
  const ok = results.filter((r) => r.status === 200).length;
  const after = await points(user);
  check("只有 1 個請求成功", ok === 1, `成功 ${ok} 個`);
  check("餘額為 0 且不是負數", after.points === 0, `餘額 ${after.points}`);
  check("只有 1 筆扣點紀錄", after.useRecords.length === 1, `${after.useRecords.length} 筆`);
}

async function testPurchase() {
  const seller = await newUser("seller");
  const buyer = await newUser("buyer");
  const other = await newUser("other");

  await seller("/api/enrollments", {
    method: "POST",
    body: { courseName: `concurrency test course ${Date.now()}`, courseTeacher: "T", weekday: "一", timeSlot: "A" },
  });
  const courseId = (await seller("/api/courses/my")).data.courses[0].id;
  const noteA = await uploadNote(seller, courseId, "note A", 10);
  const noteB = await uploadNote(seller, courseId, "note B", 10);
  const freeNote = await uploadNote(seller, courseId, "free note", 0);

  console.log("\n== 2. 檔案權限");
  const list = (await buyer(`/api/notes/list?courseId=${courseId}`)).data.notes;
  check("筆記列表不含檔案網址", list.every((n) => !("fileUrl" in n) && !("previewUrl" in n)));
  check("未購買不能拿檔案", (await buyer(`/api/notes/${noteA}/file`)).status === 403);
  check("作者可以拿自己的檔案", (await seller(`/api/notes/${noteA}/file`)).status === 200);
  check("免費筆記可以直接拿", (await buyer(`/api/notes/${freeNote}/file`)).status === 200);
  check("不能買自己的筆記", (await seller(`/api/notes/${noteA}/purchase`, { method: "POST" })).status === 400);
  check("點數不足時購買失敗", (await buyer(`/api/notes/${noteA}/purchase`, { method: "POST" })).status === 400);

  console.log(`\n== 3. 同一份筆記同時按 ${N} 次購買（餘額 20 點，夠買兩次）`);
  await buyer("/api/wallet/earn", { method: "POST", body: { amount: 20 } });
  const same = await Promise.all(
    Array.from({ length: N }, () => buyer(`/api/notes/${noteA}/purchase`, { method: "POST" }))
  );
  const sameOk = same.filter((r) => r.status === 200).length;
  check("只成功購買 1 次", sameOk === 1, `成功 ${sameOk} 個`);
  check("其餘回傳「已購買」409", same.filter((r) => r.status === 409).length === N - 1);
  check("買家只扣 10 點", (await points(buyer)).points === 10, `餘額 ${(await points(buyer)).points}`);
  check("購買後可以拿檔案", (await buyer(`/api/notes/${noteA}/file`)).status === 200);
  check("其他人仍然不能拿", (await other(`/api/notes/${noteA}/file`)).status === 403);

  console.log("\n== 4. 餘額 10 點，同時購買兩份不同的 10 點筆記");
  // noteA 已買過，用 noteB 和另一份新筆記
  const noteC = await uploadNote(seller, courseId, "note C", 10);
  const diff = await Promise.all([
    buyer(`/api/notes/${noteB}/purchase`, { method: "POST" }),
    buyer(`/api/notes/${noteC}/purchase`, { method: "POST" }),
  ]);
  const diffOk = diff.filter((r) => r.status === 200).length;
  const buyerAfter = await points(buyer);
  check("只有 1 份購買成功", diffOk === 1, `成功 ${diffOk} 份`);
  check("買家餘額為 0", buyerAfter.points === 0, `餘額 ${buyerAfter.points}`);
  check("買家共 2 筆扣點紀錄（A 與其中一份）", buyerAfter.useRecords.length === 2, `${buyerAfter.useRecords.length} 筆`);

  const sellerAfter = await points(seller);
  check("賣家收到 20 點（賣出兩份）", sellerAfter.points === 20, `賣家 ${sellerAfter.points} 點`);
  const soldA = (await buyer(`/api/notes/list?courseId=${courseId}`)).data.notes.find((n) => n.id === noteA);
  check("筆記 A 已售數為 1、買家看到已購買", soldA.soldCount === 1 && soldA.purchased === true);
}

async function testTopUp() {
  console.log("\n== 5. 儲值只接受固定方案");
  const user = await newUser("topup");
  check("任意金額 999 被拒絕", (await user("/api/wallet/earn", { method: "POST", body: { amount: 999 } })).status === 400);
  await Promise.all(Array.from({ length: N }, () => user("/api/wallet/earn", { method: "POST", body: { amount: 10 } })));
  const after = await points(user);
  check(`同時儲值 ${N} 次 10 點，點數全部入帳`, after.points === N * 10, `餘額 ${after.points}`);
}

async function main() {
  await testWalletUse();
  await testPurchase();
  await testTopUp();
  console.log(`\n結果：${passed} 通過，${failed} 失敗`);
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
