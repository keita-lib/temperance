"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PwaInstaller } from "@/components/system/PwaInstaller";
import { SeedInitializer } from "@/components/system/SeedInitializer";
import { StoragePersistor } from "@/components/system/StoragePersistor";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SeedInitializer />
      <PwaInstaller />
      <StoragePersistor />
      {children}
    </ToastProvider>
  );
}
