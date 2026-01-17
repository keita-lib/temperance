"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/components/charts/LineChart";
import { useGainLogs, useSetting } from "@/hooks/useCollections";
import { computeGoalMetrics, buildCumulativeChartPoints } from "@/lib/aggregates";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { maybePickTip } from "@/lib/tips";
import { MentorTipRecord } from "@/lib/types";

export function HomeView() {
  const gains = useGainLogs();
  const goalAmount = useSetting("goalAmount");
  const [tip, setTip] = useState<MentorTipRecord | null>(null);

  const setTipFromStorage = useEffectEvent(() => {
    if (typeof window === "undefined") return false;
    const pending = window.sessionStorage.getItem("pending-tip");
    if (!pending) return false;
    try {
      setTip(JSON.parse(pending));
    } catch (error) {
      console.error(error);
    }
    window.sessionStorage.removeItem("pending-tip");
    return true;
  });

  useEffect(() => {
    const hydrated = setTipFromStorage();
    if (hydrated) return;
    maybePickTip("launch").then((result) => {
      if (result) setTip(result);
    });
  }, []);

  const metrics = useMemo(
    () => computeGoalMetrics(gains, goalAmount),
    [gains, goalAmount],
  );

  const chartPoints = useMemo(() => buildCumulativeChartPoints(gains), [gains]);

  return (
    <PageContainer>
      <TopBar
        trailing={
          <Link href="/add" className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
            ＋節制利益
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-4 pb-8">
        {!goalAmount ? <GoalReminder /> : null}
        <StatsRow metrics={metrics} />
        {goalAmount ? <GoalCard metrics={metrics} goalAmount={goalAmount} /> : null}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">累積グラフ</h2>
            <span className="text-xs text-zinc-500">日次</span>
          </div>
          <LineChart points={chartPoints} />
        </Card>
        <Link
          href="/add"
          className="mt-2 flex items-center justify-center rounded-3xl bg-emerald-500 py-5 text-base font-semibold text-white shadow-lg shadow-emerald-200"
        >
          ＋節制利益を獲得
        </Link>
        {tip ? <TipCard tip={tip} onDismiss={() => setTip(null)} /> : null}
      </main>
    </PageContainer>
  );
}

function GoalReminder() {
  return (
    <Card className="bg-amber-50 text-amber-900">
      <p className="text-sm font-semibold">目標金額が未設定です</p>
      <p className="mt-1 text-sm">まずは叶えたい金額を決めると節制利益が貯まりやすくなります。</p>
      <Link href="/settings" className="mt-3 inline-flex rounded-2xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white">
        目標を設定
      </Link>
    </Card>
  );
}

function StatsRow({ metrics }: { metrics: ReturnType<typeof computeGoalMetrics> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-white">
        <p className="text-xs text-zinc-500">今日の節制利益</p>
        <p className="mt-2 text-2xl font-semibold">{formatCurrency(metrics.today)}</p>
      </Card>
      <Card className="bg-white">
        <p className="text-xs text-zinc-500">累積節制利益</p>
        <p className="mt-2 text-2xl font-semibold">{formatCurrency(metrics.cumulative)}</p>
      </Card>
    </div>
  );
}

function GoalCard({
  metrics,
  goalAmount,
}: {
  metrics: ReturnType<typeof computeGoalMetrics>;
  goalAmount: number;
}) {
  const progress = metrics.progressPercent ?? 0;
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-slate-200">目標</p>
          <p className="text-3xl font-semibold">{formatCurrency(goalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-300">達成率</p>
          <p className="text-2xl font-semibold">{formatPercent(metrics.progressPercent)}</p>
        </div>
      </div>
      <div className="mt-4 h-3 w-full rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-200">
        <span>残額 {metrics.remaining === null ? "--" : `${formatNumber(metrics.remaining)} 円`}</span>
        {metrics.forecastDate ? <span>予測 {metrics.forecastDate}</span> : null}
      </div>
    </Card>
  );
}

function TipCard({ tip, onDismiss }: { tip: MentorTipRecord; onDismiss: () => void }) {
  return (
    <Card className="bg-sky-50 border-sky-100 text-sky-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">メンター Lv.1</p>
        <button className="text-xs text-sky-500" onClick={onDismiss}>
          とじる
        </button>
      </div>
      <p className="mt-2 text-sm leading-5">{tip.text}</p>
    </Card>
  );
}
