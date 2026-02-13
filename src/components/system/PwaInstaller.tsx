"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function PwaInstaller() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const reloadRequestedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const trackInstalling = (worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setShowPrompt(true);
        }
      });
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service worker registration failed", error);
        return;
      }

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }

      if (registration.installing) {
        trackInstalling(registration.installing);
      }

      const updateFoundHandler = () => {
        if (registration?.installing) {
          trackInstalling(registration.installing);
        }
      };

      registration.addEventListener("updatefound", updateFoundHandler);

      return () => {
        registration?.removeEventListener("updatefound", updateFoundHandler);
      };
    };

    const cleanupPromise = register();

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => undefined);
    };
  }, []);

  const handleReload = useCallback(() => {
    if (!waitingWorker) return;
    reloadRequestedRef.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  useEffect(() => {
    if (!waitingWorker) return;
    const onControllerChange = () => {
      if (!reloadRequestedRef.current) return;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [waitingWorker]);

  if (!waitingWorker) return null;

  return (
    <>
      {showPrompt ? (
        <UpdatePrompt
          onReload={handleReload}
          onLater={() => setShowPrompt(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowPrompt(true)}
          className="fixed bottom-5 right-4 z-40 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          更新あり
        </button>
      )}
    </>
  );
}

function UpdatePrompt({ onReload, onLater }: { onReload: () => void; onLater: () => void }) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xl">
      <p className="text-sm font-semibold text-zinc-900">新しいバージョンがあります</p>
      <p className="mt-1 text-xs text-zinc-500">再読み込みして最新のTemperanceを利用しましょう。</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onLater}
          className="flex-1 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
        >
          あとで
        </button>
        <button
          type="button"
          onClick={onReload}
          className="flex-1 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
        >
          今すぐ更新
        </button>
      </div>
    </div>
  );
}
