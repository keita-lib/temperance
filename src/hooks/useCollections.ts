"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import { GainLog, PresetRecord, SettingKey, SettingMap } from "@/lib/types";

export function useGainLogs() {
  return (
    useLiveQuery(async () => {
      const results = await db.gains.orderBy("createdAt").reverse().toArray();
      return results as GainLog[];
    }, []) ?? []
  );
}

export function usePresets() {
  return (
    useLiveQuery(async () => {
      const results = await db.presets.orderBy("category").toArray();
      return results as PresetRecord[];
    }, []) ?? []
  );
}

export function useSetting<TKey extends SettingKey>(key: TKey) {
  return (
    useLiveQuery(async () => {
      const result = await db.settings.get(key);
      if (!result) return DEFAULT_SETTINGS[key];
      try {
        return JSON.parse(result.value) as SettingMap[TKey];
      } catch {
        return DEFAULT_SETTINGS[key];
      }
    }, [key]) ?? DEFAULT_SETTINGS[key]
  );
}
