"use client";

import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/add", label: "獲得" },
  { href: "/history", label: "履歴" },
  { href: "/settings", label: "設定" },
];

export function TopBar({ trailing }: { trailing?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 mb-4 flex flex-col gap-3 bg-zinc-50/80 pb-3 pt-5 backdrop-blur">
      <div className="flex items-center justify-between px-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-sky-500">Temperance</p>
          <h1 className="text-2xl font-semibold">節制利益</h1>
        </div>
        {trailing}
      </div>
      <nav className="flex justify-between px-2 text-sm font-medium">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-2xl px-3 py-2 transition",
              pathname === link.href
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
