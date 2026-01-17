"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PwaInstaller } from "@/components/system/PwaInstaller";
import { SeedInitializer } from "@/components/system/SeedInitializer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SeedInitializer />
      <PwaInstaller />
      {children}
    </ToastProvider>
  );
}
