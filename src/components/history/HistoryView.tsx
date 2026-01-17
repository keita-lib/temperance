"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGainLogs } from "@/hooks/useCollections";
import { deleteGainLog, updateGainLog } from "@/lib/actions";
import { formatCurrency, formatFullDate } from "@/lib/format";
import { GainLog } from "@/lib/types";
import { getTodayInputValue, isoToDateInput, inputDateToIso } from "@/lib/dates";

export function HistoryView() {
  const gains = useGainLogs();
  const grouped = useMemo(() => groupByDate(gains), [gains]);
  const [editingLog, setEditingLog] = useState<GainLog | null>(null);
  const [editDate, setEditDate] = useState<string>(getTodayInputValue());

  return (
    <PageContainer>
      <TopBar
        trailing={
          <Link href="/" className="text-sm text-zinc-500">
            ← ホーム
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-4 pb-10">
        <h2 className="text-lg font-semibold">履歴</h2>
        {!gains.length ? (
          <Card>
            <p className="text-sm text-zinc-500">まだ節制利益がありません。まずは1件獲得しましょう。</p>
          </Card>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => (a > b ? -1 : 1))
            .map(([date, logs]) => (
              <Card key={date}>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <p>{formatFullDate(date)}</p>
                  <p className="font-semibold text-zinc-900">
                    {formatCurrency(logs.reduce((sum, entry) => sum + entry.amount, 0))}
                  </p>
                </div>
                <ul className="mt-3 space-y-3">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{log.label}</p>
                        <p className="text-xs text-zinc-500">{formatCurrency(log.amount)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => {
                            setEditingLog(log);
                            setEditDate(isoToDateInput(log.createdAt));
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => log.id && deleteGainLog(log.id)}
                          className="text-xs text-red-500"
                        >
                          削除
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
        )}
      </main>
      {editingLog ? (
        <DateEditor
          date={editDate}
          onChange={setEditDate}
          onClose={() => setEditingLog(null)}
          onSubmit={async () => {
            if (!editingLog?.id) return;
            await updateGainLog(editingLog.id, {
              createdAt: inputDateToIso(editDate, new Date(editingLog.createdAt)),
            });
            setEditingLog(null);
          }}
        />
      ) : null}
    </PageContainer>
  );
}

function groupByDate(logs: GainLog[]) {
  return logs.reduce<Record<string, GainLog[]>>((acc, log) => {
    const day = log.createdAt.slice(0, 10);
    acc[day] = acc[day] ? [...acc[day], log] : [log];
    return acc;
  }, {});
}

function DateEditor({
  date,
  onChange,
  onClose,
  onSubmit,
}: {
  date: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-semibold">獲得日を編集</p>
        <input
          type="date"
          className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
          value={date}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={onSubmit}>
            保存
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}
