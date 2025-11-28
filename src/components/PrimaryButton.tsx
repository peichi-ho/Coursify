import React from "react";
import { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

export function PrimaryButton({
  children,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={[
        "flex h-14 w-full items-center justify-center gap-3 rounded-[14px]",
        "bg-[#3B82F6] text-[18px] font-semibold text-white transition-colors",
        "hover:bg-[#5091f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B82F6]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      {...props}
    >
      {icon && iconPosition === "left" ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? icon : null}
    </button>
  );
}
