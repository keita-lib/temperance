"use client";

import { db, ensureDefaultSettings } from "./db";
import { GainLog, PresetRecord, SettingKey, SettingMap } from "./types";

export interface TemperanceBackup {
  exportedAt: string;
  version: string;
  gains: GainLog[];
  presets: PresetRecord[];
  settings: Partial<Record<SettingKey, SettingMap[SettingKey]>>;
}

export async function exportBackup(): Promise<TemperanceBackup> {
  await ensureDefaultSettings();
  const [gains, presets, settingsRows] = await Promise.all([
    db.gains.orderBy("createdAt").toArray(),
    db.presets.toArray(),
    db.settings.toArray(),
  ]);

  const settings = settingsRows.reduce<TemperanceBackup["settings"]>((acc, entry) => {
    try {
      acc[entry.key as SettingKey] = JSON.parse(entry.value);
    } catch {
      // ignore broken entries
    }
    return acc;
  }, {});

  return {
    exportedAt: new Date().toISOString(),
    version: "0.1",
    gains,
    presets,
    settings,
  };
}

export async function importBackup(payload: TemperanceBackup) {
  if (!payload || typeof payload !== "object") {
    throw new Error("バックアップデータが不正です。");
  }
  if (!Array.isArray(payload.gains) || !Array.isArray(payload.presets)) {
    throw new Error("バックアップの形式が一致しません。");
  }

  await db.transaction("rw", [db.gains, db.presets, db.settings], async () => {
    await db.gains.clear();
    await db.presets.clear();
    await db.settings.clear();

    if (payload.gains.length) {
      await db.gains.bulkPut(payload.gains as GainLog[]);
    }
    if (payload.presets.length) {
      await db.presets.bulkPut(payload.presets as PresetRecord[]);
    }

    const entries = Object.entries(payload.settings ?? {}) as [
      SettingKey,
      SettingMap[keyof SettingMap],
    ][];
    if (entries.length) {
      await db.settings.bulkPut(
        entries.map(([key, value]) => ({
          key,
          value: JSON.stringify(value),
        })),
      );
    }
  });
  await ensureDefaultSettings();
}
