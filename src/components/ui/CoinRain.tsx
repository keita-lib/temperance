"use client";

import { CSSProperties } from "react";
import { createPortal } from "react-dom";

const COIN_COUNT = 18;

function randomId() {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

export type CoinBurst = {
  id: string;
  coins: Array<{ id: string; delay: number; offset: number; scale: number; duration: number }>;
};

export function createCoinBurst(): CoinBurst {
  return {
    id: randomId(),
    coins: Array.from({ length: COIN_COUNT }).map(() => ({
      id: randomId(),
      delay: Math.random() * 0.3,
      offset: (Math.random() - 0.5) * 140,
      scale: 0.8 + Math.random() * 0.5,
      duration: 2 + Math.random() * 0.9,
    })),
  };
}

export function CoinRain({ burst }: { burst: CoinBurst | null }) {
  const target = typeof document === "undefined" ? null : document.body;
  if (!target || !burst) return null;

  return createPortal(
    <div key={burst.id} className="coin-animation" aria-hidden="true">
      {burst.coins.map((coin) => {
        const style: CSSProperties = {
          left: `${50 + coin.offset}%`,
          animationDelay: `${coin.delay}s`,
        };
        (style as Record<string, string | number>)["--coin-offset"] = `${coin.offset}px`;
        (style as Record<string, string | number>)["--coin-scale"] = coin.scale;
        (style as Record<string, string | number>)["--coin-duration"] = `${coin.duration}s`;
        return <span key={coin.id} className="coin-animation__coin" style={style} />;
      })}
    </div>,
    target,
  );
}
