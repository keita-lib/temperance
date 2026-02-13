import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Temperance",
    short_name: "Temperance",
    description: "節制利益をその場で獲得して目標に近づくPWA",
    start_url: "/",
     scope: "/",
    display: "standalone",
     display_override: ["standalone", "minimal-ui"],
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "ja",
     orientation: "portrait",
     categories: ["productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
     shortcuts: [
       {
         name: "節制利益を獲得",
         url: "/add",
         description: "プリセットからすぐ入力",
       },
       {
         name: "最近の履歴",
         url: "/history",
         description: "今日のログを見返す",
       },
     ],
  };
}
