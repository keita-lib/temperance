import { ComponentProps } from "react";
import clsx from "clsx";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/40",
        className,
      )}
      {...rest}
    />
  );
}
