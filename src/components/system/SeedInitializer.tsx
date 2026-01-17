"use client";

import { useEffect } from "react";
import { ensureSeedData } from "@/lib/db";

export function SeedInitializer() {
  useEffect(() => {
    ensureSeedData();
  }, []);
  return null;
}
