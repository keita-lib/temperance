export type GainCategory =
  | "food"
  | "beverage"
  | "work"
  | "shopping"
  | "alcohol"
  | "gamble"
  | "other";

export interface GainLog {
  id?: number;
  amount: number;
  label: string;
  category: GainCategory;
  createdAt: string; // ISO timestamp
  presetId?: string;
}

export interface PresetRecord {
  id: string;
  label: string;
  amount: number;
  category: GainCategory;
}

export interface SettingEntry {
  key: SettingKey;
  value: string; // values are stored as JSON strings in Dexie
}

export interface MentorTipRecord {
  id: string;
  text: string;
}

export interface MentorMeta {
  lastShownDate: string | null;
  shownCount: number;
}

export interface SettingMap {
  goalAmount: number | null;
  mentorFrequency: number;
  mentorMeta: MentorMeta;
  lastSelectedDate: string | null;
  autoPresetFromManual: boolean;
}

export type SettingKey = keyof SettingMap;
