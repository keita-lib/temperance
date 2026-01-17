"use client";

import { db, getSetting, setSetting } from "./db";
import { MentorTipRecord, SettingMap } from "./types";

export type TipContext = "launch" | "gain";

const RANDOM_THRESHOLD = 0.5;

export async function maybePickTip(
  context: TipContext,
  options: { force?: boolean } = {},
): Promise<MentorTipRecord | null> {
  const frequency = await getSetting("mentorFrequency");
  const meta = await getSetting("mentorMeta");
  const today = new Date().toISOString().slice(0, 10);
  const normalizedMeta = normalizeMeta(meta, today);

  if (normalizedMeta.shownCount >= frequency) {
    if (normalizedMeta !== meta) {
      await setSetting("mentorMeta", normalizedMeta);
    }
    return null;
  }

  const shouldShow = options.force || Math.random() > RANDOM_THRESHOLD;
  if (!shouldShow) {
    if (normalizedMeta !== meta) {
      await setSetting("mentorMeta", normalizedMeta);
    }
    return null;
  }

  const tip = await pickRandomTip();
  if (!tip) return null;

  const updatedMeta: SettingMap["mentorMeta"] = {
    lastShownDate: today,
    shownCount: normalizedMeta.shownCount + 1,
  };
  await setSetting("mentorMeta", updatedMeta);
  return tip;
}

function normalizeMeta(meta: SettingMap["mentorMeta"], today: string) {
  if (!meta.lastShownDate || meta.lastShownDate !== today) {
    return {
      lastShownDate: today,
      shownCount: 0,
    };
  }
  return meta;
}

async function pickRandomTip() {
  const tips = await db.tips.toArray();
  if (!tips.length) return null;
  const index = Math.floor(Math.random() * tips.length);
  return tips[index] ?? null;
}
