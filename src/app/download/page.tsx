import Link from "next/link";

const steps = [
  {
    title: "アクセス",
    description: "Chrome もしくは Safari で temperance.app を開きます。",
  },
  {
    title: "ホームに追加",
    description: "ブラウザの共有メニューから「ホーム画面に追加」を選びます。",
  },
  {
    title: "節制利益を獲得",
    description: "プリセットや自由入力で節制利益を記録しましょう。",
  },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">Temperance</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">節制利益アプリをインストール</h1>
          <p className="mt-3 text-sm text-zinc-600">
            ホーム画面に追加すると、オフラインでもサッと節制利益を獲得できます。
          </p>
        </header>
        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100">
          <p className="text-sm font-semibold text-zinc-500">インストール手順</p>
          <ol className="mt-4 space-y-4 text-sm">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-600">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-zinc-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl bg-zinc-900 p-6 text-white">
          <p className="text-sm uppercase tracking-widest text-zinc-400">Ready</p>
          <h2 className="mt-3 text-2xl font-semibold">Temperance を開く</h2>
          <p className="mt-2 text-sm text-zinc-300">すでにインストール済みの場合は、こちらからホームへ移動できます。</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white"
          >
            アプリを開く
          </Link>
        </div>
      </div>
    </div>
  );
}
