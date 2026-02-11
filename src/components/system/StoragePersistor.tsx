"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

const WARN_KEY = "temperance:persist-warning";
const WARN_INTERVAL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function StoragePersistor() {
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function ensurePersistentStorage() {
      if (typeof navigator === "undefined" || !navigator.storage?.persist) {
        return;
      }

      try {
        let alreadyPersisted = false;
        if (navigator.storage.persisted) {
          alreadyPersisted = await navigator.storage.persisted();
        }
        if (alreadyPersisted) return;

        const granted = await navigator.storage.persist();
        if (!granted && !cancelled && shouldWarn()) {
          markWarned();
          push({
            message:
              "ストレージ不足でデータが消えないよう、ホーム画面追加やJSONバックアップの保存をおすすめします。",
          });
        }
      } catch (error) {
        console.warn("Failed to request persistent storage", error);
      }
    }

    ensurePersistentStorage();
    return () => {
      cancelled = true;
    };
  }, [push]);

  return null;
}

function shouldWarn() {
  if (typeof window === "undefined" || !window.localStorage) return true;
  const raw = window.localStorage.getItem(WARN_KEY);
  if (!raw) return true;
  const lastTs = Number(raw);
  if (!Number.isFinite(lastTs)) return true;
  return Date.now() - lastTs > WARN_INTERVAL_MS;
}

function markWarned() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(WARN_KEY, String(Date.now()));
}
