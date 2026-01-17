"use client";

import { FormEvent, useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePresets, useSetting } from "@/hooks/useCollections";
import {
  clearGoalAmount,
  setGoalAmount,
  updateMentorFrequency,
  upsertPreset,
  deletePreset,
  setAutoPresetFromManual,
} from "@/lib/actions";
import { GainCategory, PresetRecord } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import { useToast } from "@/components/ui/ToastProvider";
import { exportBackup, importBackup } from "@/lib/backup";

export function SettingsView() {
  const goalAmount = useSetting("goalAmount");
  const mentorFrequency = useSetting("mentorFrequency");
  const autoPresetFromManual = useSetting("autoPresetFromManual");
  const presets = usePresets();
  const { push } = useToast();
  const [goalInput, setGoalInput] = useState(goalAmount ? String(goalAmount) : "");
  const syncGoalInput = useEffectEvent((value: string) => {
    setGoalInput(value);
  });

  useEffect(() => {
    syncGoalInput(goalAmount ? String(goalAmount) : "");
  }, [goalAmount]);

  const handleGoalSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(goalInput);
    if (!amount || Number.isNaN(amount)) {
      push({ message: "数字で入力してください" });
      return;
    }
    await setGoalAmount(amount);
    push({ message: "目標金額を更新しました" });
  };

  const handleExport = async () => {
    const payload = await exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `temperance-backup-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    push({ message: "バックアップを保存しました" });
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      await importBackup(JSON.parse(text));
      push({ message: "データを復元しました" });
    } catch (error) {
      console.error(error);
      push({ message: "読み込みに失敗しました" });
    }
  };

  return (
    <PageContainer>
      <TopBar
        trailing={
          <Link href="/" className="text-sm text-zinc-500">
            ← ホーム
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-4 pb-16">
        <section>
          <Card>
            <h2 className="text-lg font-semibold">目標金額</h2>
            <form className="mt-4 flex flex-col gap-3" onSubmit={handleGoalSave}>
              <input
                inputMode="numeric"
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                placeholder="4000000"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  保存
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={async () => {
                    await clearGoalAmount();
                    setGoalInput("");
                    push({ message: "目標金額をクリアしました" });
                  }}
                >
                  クリア
                </Button>
              </div>
            </form>
          </Card>
        </section>
        <section>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">メンター表示頻度</h2>
              <span className="text-sm text-zinc-500">{mentorFrequency} 回/日</span>
            </div>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((value) => (
                <Button
                  key={value}
                  variant={mentorFrequency === value ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => updateMentorFrequency(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </Card>
        </section>
        <section>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">自由入力のプリセット登録</h2>
              <span className="text-sm text-emerald-600">
                {autoPresetFromManual ? "自動追加" : "手動管理"}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              ON にすると、「獲得」画面の自由入力フォームで記録したラベルと金額を自動でプリセット化します。
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                variant={autoPresetFromManual ? "primary" : "secondary"}
                onClick={() => setAutoPresetFromManual(true)}
              >
                ON
              </Button>
              <Button
                className="flex-1"
                variant={!autoPresetFromManual ? "primary" : "secondary"}
                onClick={() => setAutoPresetFromManual(false)}
              >
                OFF
              </Button>
            </div>
          </Card>
        </section>
        <section>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">プリセット編集</h2>
              <span className="text-sm text-zinc-500">{presets.length} 件</span>
            </div>
            <div className="mt-4 space-y-4">
              {presets.map((preset) => (
                <PresetRow key={preset.id} preset={preset} />
              ))}
              <PresetRow preset={{ id: "", label: "", amount: 0, category: "other" }} isNew />
            </div>
          </Card>
        </section>
        <section>
          <Card>
            <h2 className="text-lg font-semibold">バックアップ</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Button onClick={handleExport}>JSONを書き出す</Button>
              <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
                JSONを読み込む
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(event) => {
                    handleImport(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </Card>
        </section>
      </main>
    </PageContainer>
  );
}

function PresetRow({ preset, isNew }: { preset: PresetRecord; isNew?: boolean }) {
  const [form, setForm] = useState({ label: preset.label, amount: preset.amount ? String(preset.amount) : "" });
  const [category, setCategory] = useState<GainCategory>(preset.category);
  const { push } = useToast();
  const syncPreset = useEffectEvent((next: PresetRecord) => {
    setForm({ label: next.label, amount: next.amount ? String(next.amount) : "" });
    setCategory(next.category);
  });

  useEffect(() => {
    syncPreset(preset);
  }, [preset]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.label || !amount) return;
    await upsertPreset({
      id: preset.id,
      label: form.label,
      amount,
      category,
    });
    push({ message: isNew ? "プリセットを追加しました" : "プリセットを更新しました" });
    if (isNew) {
      setForm({ label: "", amount: "" });
      setCategory("other");
    }
  };

  return (
    <form className="rounded-2xl border border-zinc-100 p-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="ラベル"
          value={form.label}
          onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
        />
        <input
          inputMode="numeric"
          className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="金額"
          value={form.amount}
          onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
        />
        <select
          className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value as GainCategory)}
        >
          {CATEGORY_ORDER.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {isNew ? "追加" : "保存"}
          </Button>
          {!isNew && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                if (!preset.id) return;
                await deletePreset(preset.id);
                push({ message: "プリセットを削除しました" });
              }}
            >
              削除
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
