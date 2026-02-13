import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

const APP_URL = "https://temperance-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Temperance | 節制利益トラッカー",
    template: "%s | Temperance",
  },
  description: "節制利益を積み上げて目標達成率を可視化するローカルファーストPWA",
  manifest: "/manifest.webmanifest",
  keywords: ["節制利益", "家計", "PWA", "ローカルファースト"],
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Temperance",
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "Temperance | 節制利益トラッカー",
    description: "節制利益を積み上げて目標達成率を可視化するローカルファーストPWA",
    siteName: "Temperance",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Temperance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Temperance | 節制利益トラッカー",
    description: "節制利益を積み上げて目標達成率を可視化するローカルファーストPWA",
    images: ["/icons/icon-512.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
