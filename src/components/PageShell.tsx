// src/components/PageShell.tsx
"use client";
import React from "react";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="relative w-[390px] aspect-[9/19.5] rounded-[40px] bg-white text-[#0B1015] shadow-2xl border border-gray-200  flex items-center justify-center overflow-hidden">
            {children}
      </div>
    </div>
  );
}
