import Image from "next/image";
import Link from "next/link";
import PageShell from "../components/PageShell";

export default function Home() {
  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8 text-[#0B1015]">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-[32px] bg-white px-6 py-10 shadow-xl sm:px-10">

          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#3B82F6] sm:text-5xl md:text-6xl">
              Coursify
            </h1>
          </div>

          {/* Illustration Section - Magnifying Glass with Document */}
          <div className="relative flex items-center justify-center">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="w-48 sm:w-56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Magnifying Glass */}
              <g transform="rotate(-15 100 100)">
                {/* Glass Circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="50"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Handle */}
                <line
                  x1="140"
                  y1="140"
                  x2="170"
                  y2="170"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
              
              {/* Document inside magnifying glass */}
              <g transform="translate(80, 80)">
                {/* Document */}
                <rect
                  x="20"
                  y="20"
                  width="40"
                  height="50"
                  fill="white"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  rx="2"
                />
                {/* Folded corner */}
                <path
                  d="M 20 20 L 30 20 L 20 30 Z"
                  fill="#E5E7EB"
                  stroke="#3B82F6"
                  strokeWidth="1"
                />
                {/* Face inside document */}
                <circle cx="32" cy="35" r="2" fill="#1F2937" />
                <circle cx="48" cy="35" r="2" fill="#1F2937" />
                <line
                  x1="32"
                  y1="42"
                  x2="48"
                  y2="42"
                  stroke="#1F2937"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Blush marks */}
                <circle cx="26" cy="38" r="3" fill="#93C5FD" opacity="0.6" />
                <circle cx="54" cy="38" r="3" fill="#93C5FD" opacity="0.6" />
              </g>
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-4">
            {/* Login Button */}
            <Link href="/login" className="block w-full">
              <button className="flex h-14 w-full items-center justify-center gap-3 rounded-[12px] bg-[#3B82F6] text-base font-medium text-white transition-colors hover:bg-[#2563EB] active:bg-[#1D4ED8]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="4" y="4" width="12" height="12" rx="2" fill="white" />
                  <rect x="6" y="6" width="8" height="3" rx="1" fill="#3B82F6" />
                </svg>
                登入
              </button>
            </Link>
          </div>

            {/* Register Button */}
          <Link href="/signup" className="block w-full">
            <button className="flex h-14 w-full items-center justify-center gap-3 rounded-[12px] bg-[#3B82F6] text-base font-medium text-white transition-colors hover:bg-[#2563EB] active:bg-[#1D4ED8]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="4" width="12" height="12" rx="2" fill="white" />
                <rect x="6" y="6" width="8" height="3" rx="1" fill="#3B82F6" />
              </svg>
              註冊
            </button>
          </Link>
          </div>
        </div>

 
   </PageShell>
  );
}