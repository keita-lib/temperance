"use client";

import { db, setSetting } from "@/lib/db";
import { GainCategory, GainLog, PresetRecord } from "@/lib/types";

export interface CreateGainInput {
  amount: number;
  label: string;
  category: GainCategory;
  presetId?: string;
  createdAt?: string;
}

export async function createGainLog(input: CreateGainInput) {
  const payload: GainLog = {
    amount: Math.max(0, Math.round(input.amount)),
    label: input.label || "節制利益",
    category: input.category,
    presetId: input.presetId,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  const id = await db.gains.add(payload);
  return { ...payload, id };
}

export async function deleteGainLog(id: number) {
  await db.gains.delete(id);
}

export async function updateGainLog(id: number, patch: Partial<GainLog>) {
  await db.gains.update(id, patch);
}

export async function setGoalAmount(amount: number) {
  await setSetting("goalAmount", Math.max(0, Math.round(amount)));
}

export async function clearGoalAmount() {
  await setSetting("goalAmount", null);
}

export async function updateMentorFrequency(perDay: number) {
  const normalized = Math.min(3, Math.max(1, Math.round(perDay)));
  await setSetting("mentorFrequency", normalized);
}

export async function setLastSelectedDate(date: string | null) {
  await setSetting("lastSelectedDate", date?.trim() ? date : null);
}

export async function setAutoPresetFromManual(enabled: boolean) {
  await setSetting("autoPresetFromManual", enabled);
}

export async function upsertPreset(preset: PresetRecord) {
  const payload: PresetRecord = {
    ...preset,
    id: preset.id || crypto.randomUUID(),
  };
  await db.presets.put(payload);
}

export async function deletePreset(id: string) {
  await db.presets.delete(id);
}
