import { GainCategory } from "./types";

export const CATEGORY_LABELS: Record<GainCategory, string> = {
  food: "食",
  beverage: "飲み物",
  work: "仕事",
  shopping: "買い物",
  alcohol: "アルコール",
  gamble: "ギャンブル",
  other: "その他",
};

export const CATEGORY_ORDER: GainCategory[] = [
  "food",
  "beverage",
  "work",
  "shopping",
  "alcohol",
  "gamble",
  "other",
];
