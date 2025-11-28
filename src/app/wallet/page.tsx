// src/app/wallet/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import PageShell from "@/components/PageShell";
import SideDrawer from "@/components/SideDrawer";
import { useRouter } from "next/navigation";

const LS_USER_KEY = "coursify:user";

type WalletUser = {
  id: number;
  name: string;
  department?: string | null;
};

type RecordItem = {
  id: number;
  message: string;
  amount: number;
  dateISO: string;
};

export default function WalletPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [user, setUser] = useState<WalletUser | null>(null);
  const [points, setPoints] = useState(0);
  const [earnRecords, setEarnRecords] = useState<RecordItem[]>([]);
  const [useRecords, setUseRecords] = useState<RecordItem[]>([]);
  const [activeTab, setActiveTab] = useState<"earn" | "use">("earn");
  const [loading, setLoading] = useState(true);

  // 讀 user + 錢包 summary
  useEffect(() => {
    async function loadWallet() {
      try {
        const raw = localStorage.getItem(LS_USER_KEY);
        if (!raw) {
          router.push("/login");
          return;
        }
        const stored = JSON.parse(raw);
        const userId = Number(stored.id);
        if (!userId || Number.isNaN(userId)) {
          router.push("/login");
          return;
        }

        const res = await fetch(`/api/wallet/summary?userId=${userId}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          console.error("載入錢包失敗");
          setLoading(false);
          return;
        }

        setUser({
          id: data.user.id,
          name: data.user.name,
          department: data.user.department ?? "",
        });
        setPoints(data.points ?? 0);
        setEarnRecords(data.earnRecords ?? []);
        setUseRecords(data.useRecords ?? []);

        // 順便把最新點數寫回 localStorage（讓 sidebar 看到）
        const updatedStored = { ...stored, points: data.points ?? 0 };
        localStorage.setItem(LS_USER_KEY, JSON.stringify(updatedStored));
      } catch (e) {
        console.error("載入錢包發生錯誤", e);
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [router]);

  const displayName = user?.name ?? "使用者";

  const purchaseOptions = [
    { id: 10, label: "X10", price: 10 },
    { id: 20, label: "X20", price: 20 },
    { id: 40, label: "X40", price: 25 },
    { id: 50, label: "X50", price: 40 },
    { id: 100, label: "X100", price: 80 },
  ];

  const handleNav = (path: string) => {
    router.push(path);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };

  // ⭐ 點擊「我要購買」的某一個方案 -> 呼叫 /api/wallet/earn -> 點數增加 + 新增一筆獲得紀錄
  const handlePurchase = async (opt: { id: number; label: string; price: number }) => {
    if (!user) {
      alert("尚未登入");
      return;
    }

    try {
      const res = await fetch("/api/wallet/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: opt.id,
          message: `購買點數方案 ${opt.label}（${opt.price}元）`,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        alert(data?.error ?? "購買點數失敗");
        return;
      }

      // 更新點數
      setPoints(data.points ?? 0);

      // 把新紀錄加到 earnRecords 最前面
      if (data.transaction) {
        setEarnRecords((prev) => [
          {
            id: data.transaction.id,
            message: data.transaction.message,
            amount: data.transaction.amount,
            dateISO: data.transaction.dateISO,
          },
          ...prev,
        ]);
      }

      // 更新 localStorage 讓 sidebar 看到最新點數
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        stored.points = data.points ?? 0;
        localStorage.setItem(LS_USER_KEY, JSON.stringify(stored));
      }

      // 示意訊息
      alert(`購買成功！你的點數增加 ${opt.id}，目前點數：${data.points}`);
    } catch (e) {
      console.error("購買點數發生錯誤", e);
      alert("購買點數失敗");
    }
  };

  return (
    <PageShell>
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNav={handleNav}
      />

      <div className="flex h-full w-full flex-col overflow-y-auto">
        {/* Header：顏色／寬度同 CoursesPage */}
        <div className="relative rounded-b-3xl bg-gradient-to-br from-[#3B82F6] to-[#7aa8ff] px-6 pt-8 pb-6">
          <button
            aria-label="開啟選單"
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="mt-6 text-3xl font-bold text-white">
            {displayName}的錢包
          </h1>
          <p className="mt-2 text-white/90 text-sm">
            目前點數：<span className="font-semibold">x {points}</span>
          </p>
        </div>

        {/* 內容區 */}
        <div className="flex-1 px-4 py-5 space-y-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-[#e8f1ff] p-1 text-sm font-medium text-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab("earn")}
              className={[
                "flex-1 py-2 rounded-lg text-center transition-colors",
                activeTab === "earn"
                  ? "bg-white text-[#3B82F6] shadow-sm"
                  : "bg-transparent",
              ].join(" ")}
            >
              獲得紀錄
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("use")}
              className={[
                "flex-1 py-2 rounded-lg text-center transition-colors",
                activeTab === "use"
                  ? "bg白 text-[#3B82F6] shadow-sm"
                  : "bg-transparent",
              ].join(" ")}
            >
              使用紀錄
            </button>
          </div>

          {/* 紀錄列表 */}
          <div className="min-h-[160px]">
            {loading ? (
              <p className="text-center text-sm text-gray-500 mt-10">
                載入中…
              </p>
            ) : activeTab === "earn" ? (
              earnRecords.length === 0 ? (
                <p className="text-center text-sm text-gray-500 mt-10">
                  目前無獲得紀錄
                </p>
              ) : (
                earnRecords.map((r) => (
                  <div
                    key={r.id}
                    className="mb-3 rounded-2xl bg-[#eef5ff] px-4 py-3 text-sm text-[#0B1015] shadow-sm"
                  >
                    <div className="whitespace-pre-line">{r.message}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(r.dateISO)}</span>
                      <span className="inline-flex items-center gap-1 text-[#0B1015] font-semibold">
                        + {r.amount}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : useRecords.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-10">
                目前無使用紀錄
              </p>
            ) : (
              useRecords.map((r) => (
                <div
                  key={r.id}
                  className="mb-3 rounded-2xl bg-[#eef5ff] px-4 py-3 text-sm text-[#0B1015] shadow-sm"
                >
                  <div className="whitespace-pre-line">{r.message}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(r.dateISO)}</span>
                    <span className="inline-flex items-center gap-1 text-[#0B1015] font-semibold">
                      - {r.amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 我要購買 */}
          <div className="rounded-2xl bg-[#eef5ff] px-4 py-3 text-sm text-[#0B1015] shadow-sm">
            <div className="mb-2 font-semibold">我要購買</div>
            <div className="space-y-1">
              {purchaseOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePurchase(opt)}
                  className="flex w-full items-center justify-between py-1 text-left hover:bg-white/60 rounded-lg px-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>$</span>
                    <span>{opt.label}</span>
                  </span>
                  <span>{opt.price}元</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
