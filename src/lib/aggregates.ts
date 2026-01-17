import { GainLog } from "./types";

export interface GoalMetrics {
  today: number;
  cumulative: number;
  remaining: number | null;
  progressPercent: number | null;
  forecastDate: string | null;
}

export interface ChartPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDisplayDate = (date: Date) =>
  `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

export function computeGoalMetrics(
  gains: GainLog[],
  goalAmount: number | null,
  now = new Date(),
): GoalMetrics {
  const todayKey = formatDayKey(now);
  const today = gains
    .filter((gain) => gain.createdAt.slice(0, 10) === todayKey)
    .reduce((sum, gain) => sum + gain.amount, 0);

  const cumulative = gains.reduce((sum, gain) => sum + gain.amount, 0);
  const remaining = goalAmount ? Math.max(goalAmount - cumulative, 0) : null;
  const progressPercent = goalAmount
    ? Math.min(100, parseFloat(((cumulative / goalAmount) * 100).toFixed(1)))
    : null;

  const forecastDate = goalAmount
    ? estimateForecastDate(gains, goalAmount, now, remaining ?? 0)
    : null;

  return { today, cumulative, remaining, progressPercent, forecastDate };
}

function estimateForecastDate(
  gains: GainLog[],
  goalAmount: number,
  now: Date,
  remaining: number,
) {
  if (goalAmount <= 0 || remaining <= 0) return null;
  const recentDailyTotals = getRecentDailyTotals(gains, now, 7);
  const dailyAverage =
    recentDailyTotals.length > 0
      ? recentDailyTotals.reduce((sum, value) => sum + value, 0) / recentDailyTotals.length
      : 0;
  if (!dailyAverage || dailyAverage <= 0) return null;

  const daysNeeded = Math.ceil(remaining / dailyAverage);
  const forecast = new Date(now.getTime() + daysNeeded * DAY_MS);
  return formatDisplayDate(forecast);
}

function getRecentDailyTotals(gains: GainLog[], now: Date, days: number) {
  const totalsByDay = buildDailyTotals(gains);
  const results: number[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(now.getTime() - i * DAY_MS);
    const key = formatDayKey(day);
    results.push(totalsByDay[key] ?? 0);
  }
  const meaningfulDays = results.filter((value) => value > 0);
  return meaningfulDays.length >= 2 ? results.reverse() : [];
}

export function buildCumulativeChartPoints(gains: GainLog[]): ChartPoint[] {
  const totals = buildDailyTotals(gains);
  const keys = Object.keys(totals).sort();
  let running = 0;
  return keys.map((key) => {
    running += totals[key] ?? 0;
    return { date: key, value: running };
  });
}

function buildDailyTotals(gains: GainLog[]) {
  return gains.reduce<Record<string, number>>((acc, gain) => {
    const day = gain.createdAt.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + gain.amount;
    return acc;
  }, {});
}
