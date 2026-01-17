"use client";

import clsx from "clsx";
import { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = "primary",
  fullWidth,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        {
          "bg-zinc-900 text-white hover:bg-black": variant === "primary",
          "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50": variant === "secondary",
          "bg-transparent text-zinc-500 hover:text-zinc-900": variant === "ghost",
        },
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
