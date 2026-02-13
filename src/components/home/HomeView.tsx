"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { TopBar } from "@/components/layout/TopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/components/charts/LineChart";
import { useGainLogs, useSetting } from "@/hooks/useCollections";
import { computeGoalMetrics, buildCumulativeChartPoints } from "@/lib/aggregates";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { maybePickTip } from "@/lib/tips";
import { MentorTipRecord } from "@/lib/types";
import * as htmlToImage from "html-to-image";

export function HomeView() {
  const gains = useGainLogs();
  const goalAmount = useSetting("goalAmount");
  const [tip, setTip] = useState<MentorTipRecord | null>(null);
  const shareTargetRef = useRef<HTMLDivElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [fallbackShare, setFallbackShare] = useState<FallbackState | null>(null);
  const [showQr, setShowQr] = useState(false);

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

  const captureShareAsset = useCallback(async () => {
    const node = shareTargetRef.current;
    if (!node) throw new Error("Missing share target");

    const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
    const blob = await htmlToImage.toBlob(node, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#f4f4f5",
    });
    if (!blob) throw new Error("Failed to build image");
    return new File([blob], `temperance-home-${Date.now()}.png`, { type: "image/png" });
  }, []);

  const shareViaSystem = useCallback(
    async ({ text, includeImage }: { text?: string; includeImage?: boolean }) => {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (!nav?.share) return false;

      const shareData: ShareData = {};
      if (text) shareData.text = text;

      if (includeImage) {
        try {
          const file = await captureShareAsset();
          const files = [file];
          if (typeof nav.canShare === "function" && !nav.canShare({ files })) return false;
          await nav.share({ ...shareData, files });
          return true;
        } catch (error) {
          console.warn("shareViaSystem image share failed", error);
          return false;
        }
      }

      try {
        await nav.share(shareData);
        return true;
      } catch (error) {
        console.warn("shareViaSystem failed", error);
        return false;
      }
    },
    [captureShareAsset],
  );

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      if (isSharing) return;

      setIsSharing(true);
      setShareMessage(null);

      try {
        const shareText = buildShareText(metrics);

        if (platform === "x") {
          const shared = await shareViaSystem({ text: shareText, includeImage: true });
          if (shared) {
            setShareMessage("共有メニューを開きました。Xを選ぶと画像付きで投稿できます。");
            return;
          }

          const file = await captureShareAsset();
          downloadFile(file);
          await tryCopyText(shareText);
          setFallbackShare({ platform: "x", shareText, savedFileName: file.name });
          return;
        }

        if (platform === "facebook") {
          const shared = await shareViaSystem({ text: shareText, includeImage: true });
          if (shared) {
            setShareMessage("共有メニューを開きました。Facebookを選ぶとそのまま投稿できます。");
            return;
          }

          const file = await captureShareAsset();
          downloadFile(file);
          await tryCopyText(shareText);
          setFallbackShare({ platform: "facebook", shareText, savedFileName: file.name });
          return;
        }

        if (platform === "instagram") {
          const shared = await shareViaSystem({ text: shareText, includeImage: true });
          if (shared) {
            setShareMessage("共有メニューを開きました。Instagramを選んでポストしてください。");
            return;
          }

          const file = await captureShareAsset();
          downloadFile(file);
          await tryCopyText(shareText);
          setFallbackShare({ platform: "instagram", shareText, savedFileName: file.name });
          return;
        }
      } catch (error) {
        console.error("Failed to share home view", error);
        setShareMessage("共有に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setIsSharing(false);
      }
    },
    [captureShareAsset, isSharing, metrics, shareViaSystem],
  );

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
        <ShareCta
          isSharing={isSharing}
          onShare={handleShare}
          helperText={shareMessage}
          className="pt-1"
          onToggleQr={() => setShowQr((prev) => !prev)}
          isQrOpen={showQr}
        />
        {showQr ? <QrShareCard onDismiss={() => setShowQr(false)} /> : null}
        <div ref={shareTargetRef} className="flex flex-col gap-4">
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
        </div>
      </main>
      {fallbackShare ? (
        <ShareFallbackDialog
          platform={fallbackShare.platform}
          savedFileName={fallbackShare.savedFileName}
          onClose={() => setFallbackShare(null)}
          onContinue={() => {
            if (fallbackShare.platform === "x") {
              openShareWindow(buildXUrl(fallbackShare.shareText));
            } else if (fallbackShare.platform === "facebook") {
              openShareWindow(buildFacebookUrl(fallbackShare.shareText));
            }
            setFallbackShare(null);
          }}
        />
      ) : null}
    </PageContainer>
  );
}

type FallbackState = { platform: SharePlatform; shareText: string; savedFileName?: string };

const APP_URL = "https://temperance-six.vercel.app";

function buildShareText(metrics: ReturnType<typeof computeGoalMetrics>) {
  const today = formatCurrency(metrics.today);
  const total = formatCurrency(metrics.cumulative);
  return [`節制利益アプリで節制利益獲得中！`, `今日 ${today}`, `累積 ${total}`, APP_URL]
    .join("\n")
    .trim();
}

function buildXUrl(text: string) {
  const url = new URL("https://twitter.com/intent/tweet");
  url.searchParams.set("text", `${text}\n#節制利益`);
  return url.toString();
}

function buildFacebookUrl(text: string) {
  const url = new URL("https://www.facebook.com/sharer/sharer.php");
  url.searchParams.set("u", APP_URL);
  url.searchParams.set("quote", text);
  return url.toString();
}

function openShareWindow(url: string) {
  if (typeof window === "undefined") return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;
}

async function tryCopyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore copy failures
  }
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type SharePlatform = "x" | "facebook" | "instagram";

function QrShareCard({ onDismiss }: { onDismiss: () => void }) {
  const displayUrl = APP_URL.replace(/^https?:\/\//, "");
  return (
    <Card className="flex flex-col gap-3 bg-white">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-zinc-500">QRコードで配布</p>
        <button className="text-xs font-semibold text-emerald-600" onClick={onDismiss}>
          閉じる
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-zinc-600">
            別のスマホのカメラで読み取ると Temperance の紹介ページ（{displayUrl}）に飛び、そこからアクセスできます。
          </p>
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center text-sm font-semibold text-emerald-600"
          >
            {displayUrl}
          </a>
        </div>
        <div className="shrink-0 rounded-2xl bg-zinc-50 p-2">
          <QRCodeSVG
            value={APP_URL}
            size={110}
            fgColor="#0f172a"
            bgColor="#ffffff"
            level="M"
            includeMargin
            aria-label="TemperanceのURL QRコード"
          />
        </div>
      </div>
    </Card>
  );
}

function ShareCta({
  isSharing,
  onShare,
  helperText,
  onToggleQr,
  isQrOpen,
  className = "",
}: {
  isSharing: boolean;
  onShare: (platform: SharePlatform) => void;
  helperText: string | null;
  onToggleQr: () => void;
  isQrOpen: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="grid w-full grid-cols-4 gap-2 text-[11px] font-semibold">
        <ShareShortcut label="にポスト" accent="bg-black text-white" disabled={isSharing} onClick={() => onShare("x")}>
          <XIcon className="h-4 w-4" />
        </ShareShortcut>
        <ShareShortcut
          label="Instagram"
          accent="bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400 text-white"
          disabled={isSharing}
          onClick={() => onShare("instagram")}
        >
          <InstagramIcon className="h-4 w-4" />
        </ShareShortcut>
        <ShareShortcut label="Facebook" accent="bg-blue-600 text-white" disabled={isSharing} onClick={() => onShare("facebook")}>
          <FacebookIcon className="h-4 w-4" />
        </ShareShortcut>
        <ShareShortcut
          label="広める"
          accent={
            isQrOpen
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-white text-zinc-900 border border-zinc-200"
          }
          disabled={false}
          onClick={onToggleQr}
        >
          <ShareIcon className="h-4 w-4" />
        </ShareShortcut>
      </div>
      {helperText ? <p className="text-center text-xs text-zinc-500">{helperText}</p> : null}
    </div>
  );
}

function ShareShortcut({
  children,
  label,
  accent,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  accent: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accent} ${disabled ? "opacity-60" : ""}`}
    >
      {children}
      {label}
    </button>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.3" />
      <circle cx="17" cy="7" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.5 8H16V4.5h-2a4 4 0 0 0-4 4V11H7v3.5h3v5h3.5v-5h2.5L16 11h-2.5V8z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 11 6.8-4" />
      <path d="m8.6 13 6.8 4" />
    </svg>
  );
}

const fallbackContent: Record<SharePlatform, { title: string; body: (fileName?: string) => string[]; actionLabel?: string }> = {
  x: {
    title: "Xにポストする手順",
    body: (fileName) => [
      "お使いのブラウザでは画像の自動添付に対応していません。",
      `1. ホーム画面の画像を自動保存しました（${fileName ?? "temperance-home.png"}）`,
      "2. 共有テキストをコピー済みです", 
      "3. Xアプリで新規ポスト → 画像を添付してテキストを貼り付けます",
    ],
    actionLabel: "Xの投稿画面を開く",
  },
  instagram: {
    title: "Instagramにシェア",
    body: (fileName) => [
      "ブラウザからInstagramアプリへ直接画像を送ることができません。",
      `1. ホーム画面の画像を自動保存しました（${fileName ?? "temperance-home.png"}）`,
      "2. 共有テキストをコピー済みです",
      "3. Instagramアプリで新規投稿 → 画像を選び、本文にテキストを貼り付けます",
    ],
  },
  facebook: {
    title: "Facebookにシェア",
    body: (fileName) => [
      "ブラウザの共有に対応していないため、Facebookの投稿画面を開きます。",
      `1. ホーム画面の画像を自動保存しました（${fileName ?? "temperance-home.png"}）`,
      "2. 共有テキストをコピー済みです",
      "3. Facebookの投稿画面で画像を選び、テキストを貼り付けてください",
    ],
    actionLabel: "Facebookの投稿画面を開く",
  },
};

function ShareFallbackDialog({
  platform,
  savedFileName,
  onClose,
  onContinue,
}: {
  platform: SharePlatform;
  savedFileName?: string;
  onClose: () => void;
  onContinue: () => void;
}) {
  const content = fallbackContent[platform];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold text-emerald-500">共有ヒント</p>
        <h3 className="mt-2 text-lg font-semibold">{content.title}</h3>
        <div className="mt-3 space-y-2 text-sm text-zinc-600">
          {content.body(savedFileName).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {content.actionLabel ? (
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {content.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
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
