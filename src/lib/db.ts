"use client";

import Dexie, { Table } from "dexie";
import presetsSeed from "../../data/presets.json";
import tipsSeed from "../../data/tips.json";
import {
  GainLog,
  MentorTipRecord,
  PresetRecord,
  SettingEntry,
  SettingKey,
  SettingMap,
} from "./types";

const DB_NAME = "temperance";
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: SettingMap = {
  goalAmount: null,
  mentorFrequency: 1,
  mentorMeta: {
    lastShownDate: null,
    shownCount: 0,
  },
  lastSelectedDate: null,
  autoPresetFromManual: false,
};

class TemperanceDatabase extends Dexie {
  gains!: Table<GainLog, number>;
  presets!: Table<PresetRecord, string>;
  settings!: Table<SettingEntry, SettingKey>;
  tips!: Table<MentorTipRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      gains: "++id, createdAt, category",
      presets: "id, category",
      settings: "key",
      tips: "id",
    });

    this.on("populate", async () => {
      await this.presets.bulkPut(presetsSeed as PresetRecord[]);
      await this.tips.bulkPut(tipsSeed as MentorTipRecord[]);
      await seedDefaultSettings();
    });
  }
}

export const db = new TemperanceDatabase();
const openPromise = db.open().catch(() => undefined);

async function seedDefaultSettings() {
  const entries = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
    key: key as SettingKey,
    value: JSON.stringify(value),
  }));
  await db.settings.bulkPut(entries);
}

export async function ensureSeedData() {
  await openPromise;
  const [presetCount, tipCount] = await Promise.all([
    db.presets.count(),
    db.tips.count(),
  ]);

  if (presetCount === 0) {
    await db.presets.bulkPut(presetsSeed as PresetRecord[]);
  }
  if (tipCount === 0) {
    await db.tips.bulkPut(tipsSeed as MentorTipRecord[]);
  }
  await ensureDefaultSettings();
}

export async function ensureDefaultSettings() {
  await openPromise;
  await Promise.all(
    (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).map(async (key) => {
      const existing = await db.settings.get(key);
      if (!existing) {
        await db.settings.put({
          key,
          value: JSON.stringify(DEFAULT_SETTINGS[key]),
        });
      }
    }),
  );
}

function parseSettingValue<TValue>(value: string | undefined, fallback: TValue) {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as TValue;
  } catch (error) {
    console.warn("Failed to parse setting", error);
    return fallback;
  }
}

export async function getSetting<TKey extends SettingKey>(
  key: TKey,
): Promise<SettingMap[TKey]> {
  await ensureDefaultSettings();
  const entry = await db.settings.get(key);
  return parseSettingValue(entry?.value, DEFAULT_SETTINGS[key]);
}

export async function setSetting<TKey extends SettingKey>(
  key: TKey,
  value: SettingMap[TKey],
) {
  await db.settings.put({ key, value: JSON.stringify(value) });
}

export async function updateSetting<TKey extends SettingKey>(
  key: TKey,
  updater: (value: SettingMap[TKey]) => SettingMap[TKey],
) {
  const current = await getSetting(key);
  await setSetting(key, updater(current));
}
