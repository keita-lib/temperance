"use client";

import { FormEvent, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CoinRain, createCoinBurst, type CoinBurst } from "@/components/ui/CoinRain";
import { usePresets, useSetting } from "@/hooks/useCollections";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import {
  createGainLog,
  deleteGainLog,
  setLastSelectedDate,
  upsertPreset,
} from "@/lib/actions";
import { GainCategory, PresetRecord } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrency } from "@/lib/format";
import { maybePickTip } from "@/lib/tips";
import { getTodayInputValue, inputDateToIso } from "@/lib/dates";

interface ManualFormState {
  label: string;
  amount: string;
  category: GainCategory;
}

const DEFAULT_FORM: ManualFormState = {
  label: "",
  amount: "",
  category: "other",
};

export function AddView() {
  const presets = usePresets();
  const storedDate = useSetting("lastSelectedDate");
  const autoPresetFromManual = useSetting("autoPresetFromManual");
  const grouped = useMemo(() => groupPresets(presets), [presets]);
  const { push } = useToast();
  const [form, setForm] = useState<ManualFormState>(() => ({ ...DEFAULT_FORM }));
  const [activePreset, setActivePreset] = useState<PresetRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState(storedDate ?? getTodayInputValue());
  const [coinBurst, setCoinBurst] = useState<CoinBurst | null>(null);
  const coinAudioRef = useRef<HTMLAudioElement | null>(null);
  const coinTimeout = useRef<number | null>(null);
  const landingSoundTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio("/audio/coin-chime.mp3");
    audio.volume = 0.5;
    audio.preload = "auto";
    coinAudioRef.current = audio;
  }, []);

  const cleanupCoinBurst = useCallback(() => {
    if (coinTimeout.current) {
      clearTimeout(coinTimeout.current);
      coinTimeout.current = null;
    }
    if (landingSoundTimeout.current) {
      clearTimeout(landingSoundTimeout.current);
      landingSoundTimeout.current = null;
    }
    setCoinBurst(null);
  }, []);

  const playCoinLandingSound = useCallback(() => {
    const sound = coinAudioRef.current;
    if (!sound) return;
    try {
      sound.pause();
      sound.currentTime = 0;
      void sound.play();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const scheduleLandingSound = useCallback(
    (burst: CoinBurst) => {
      if (!burst.coins.length) return;
      if (landingSoundTimeout.current) {
        clearTimeout(landingSoundTimeout.current);
      }
      if (typeof window === "undefined") return;
      const landingRatio = 0.32; // 32% of animation is the first ground contact
      const earliestLanding = Math.min(
        ...burst.coins.map((coin) => coin.delay + coin.duration * landingRatio),
      );
      const timeoutMs = Math.max(0, earliestLanding) * 1000;
      landingSoundTimeout.current = window.setTimeout(() => {
        playCoinLandingSound();
        landingSoundTimeout.current = null;
      }, timeoutMs);
    },
    [playCoinLandingSound],
  );

  const triggerCoinBurst = useCallback(() => {
    cleanupCoinBurst();
    const burst = createCoinBurst();
    setCoinBurst(burst);
    scheduleLandingSound(burst);
    coinTimeout.current = window.setTimeout(() => {
      cleanupCoinBurst();
    }, 2600);
  }, [cleanupCoinBurst, scheduleLandingSound]);

  useEffect(() => {
    return () => {
      cleanupCoinBurst();
    };
  }, [cleanupCoinBurst]);
  const syncStoredDate = useEffectEvent((value: string | null) => {
    if (value) {
      setSelectedDate(value);
    }
  });

  const handleDateChange = (value: string) => {
    const next = value && value.trim() ? value : getTodayInputValue();
    setSelectedDate(next);
    setLastSelectedDate(next);
  };

  useEffect(() => {
    syncStoredDate(storedDate);
  }, [storedDate]);

  const handleCreate = async (payload: {
    amount: number;
    label: string;
    category: GainCategory;
    presetId?: string;
  }) => {
    if (!payload.amount || payload.amount <= 0) return;
    triggerCoinBurst();
    const gain = await createGainLog({
      ...payload,
      createdAt: inputDateToIso(selectedDate),
    });
    push({
      message: `${formatCurrency(payload.amount)} を獲得`,
      action: {
        label: "Undo",
        onClick: () => {
          if (gain.id) deleteGainLog(gain.id);
        },
      },
    });
    const tip = await maybePickTip("gain", { force: true });
    if (tip && typeof window !== "undefined") {
      sessionStorage.setItem("pending-tip", JSON.stringify(tip));
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    await handleCreate({
      amount,
      label: form.label || "自由入力",
      category: form.category,
    });
    if (autoPresetFromManual && form.label.trim()) {
      const trimmedLabel = form.label.trim();
      const exists = presets.some(
        (preset) => preset.label === trimmedLabel && preset.category === form.category,
      );
      if (!exists) {
        await upsertPreset({
          id: "",
          label: trimmedLabel,
          amount,
          category: form.category,
        });
      }
    }
    setForm({ ...DEFAULT_FORM });
  };

  return (
    <PageContainer>
      <CoinRain burst={coinBurst} />
      <TopBar
        trailing={
          <Link href="/" className="text-sm text-zinc-500">
            ← ホーム
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-4 pb-12">
        <section>
          <Card>
            <label className="text-xs text-zinc-500">獲得日</label>
            <input
              type="date"
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
            />
            <p className="mt-1 text-xs text-zinc-400">当日以外の節制利益もここから記録できます。</p>
          </Card>
        </section>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">プリセット</h2>
            <Link href="/settings" className="text-sm text-zinc-500">
              編集
            </Link>
          </div>
          {CATEGORY_ORDER.map((category) => (
            <CategoryGroup
              key={category}
              label={CATEGORY_LABELS[category]}
              presets={grouped[category]}
              onSelect={(preset) => handleCreate(preset)}
              onOpenEditor={setActivePreset}
            />
          ))}
        </section>
        <section>
          <Card>
            <h3 className="text-base font-semibold">自由入力</h3>
            <form className="mt-4 space-y-3" onSubmit={handleManualSubmit}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">メモ（任意）</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  value={form.label}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="例: アイスコーヒー"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">金額（円）</label>
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  value={form.amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">カテゴリ</label>
                <select
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value as GainCategory }))
                  }
                >
                  {CATEGORY_ORDER.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" fullWidth>
                獲得する
              </Button>
            </form>
          </Card>
        </section>
      </main>
      {activePreset ? (
        <PresetEditor
          preset={activePreset}
          onClose={() => setActivePreset(null)}
          onSubmit={(values) => handleCreate(values)}
        />
      ) : null}
    </PageContainer>
  );
}

function CategoryGroup({
  label,
  presets,
  onSelect,
  onOpenEditor,
}: {
  label: string;
  presets: PresetRecord[];
  onSelect: (payload: { amount: number; label: string; category: GainCategory; presetId: string }) => void;
  onOpenEditor: (preset: PresetRecord) => void;
}) {
  if (!presets?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            role="button"
            tabIndex={0}
            className="cursor-pointer rounded-2xl border border-zinc-100 bg-white px-3 py-3 text-left text-sm shadow-sm focus-within:ring-2 focus-within:ring-emerald-400"
            onClick={() =>
              onSelect({
                amount: preset.amount,
                label: preset.label,
                category: preset.category,
                presetId: preset.id,
              })
            }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect({
                    amount: preset.amount,
                    label: preset.label,
                    category: preset.category,
                    presetId: preset.id,
                  });
                }
              }}
            >
              <p className="font-semibold">{preset.label}</p>
              <p className="text-sm text-zinc-500">{formatCurrency(preset.amount)}</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 hover:border-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
              onClick={(event) => {
                event.stopPropagation();
                onOpenEditor(preset);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 stroke-current"
                fill="none"
                strokeWidth={2}
              >
                <path d="M12 5l7 7-7 7" />
                <path d="M5 12h14" />
              </svg>
              金額を編集
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PresetEditor({
  preset,
  onClose,
  onSubmit,
}: {
  preset: PresetRecord;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    label: string;
    category: GainCategory;
    presetId?: string;
  }) => void;
}) {
  const [amount, setAmount] = useState(String(preset.amount));
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-semibold">{preset.label} の金額</p>
        <input
          className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              const numericAmount = Number(amount);
              if (!numericAmount) return;
              onSubmit({
                amount: numericAmount,
                label: preset.label,
                category: preset.category,
                presetId: preset.id,
              });
              onClose();
            }}
          >
            この金額で獲得
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}

function groupPresets(presets: PresetRecord[]) {
  const base = CATEGORY_ORDER.reduce<Record<GainCategory, PresetRecord[]>>((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<GainCategory, PresetRecord[]>);
  return presets.reduce((acc, preset) => {
    acc[preset.category].push(preset);
    return acc;
  }, base);
}
