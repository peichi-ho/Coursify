import React from "react";
export function SocialButtons() {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#e8f1ff]">
          <div className="flex items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#4285F4]">
              G
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0077B5] text-lg font-semibold text-white">
              in
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-[#0B1015]">Sign up with</p>
      </div>
    );
  }