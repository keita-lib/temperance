
# temperance
節制利益を積み重ねるアプリ

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Temperance
>>>>>>> 0f56916 (feat: initial Temperance MVP)

Temperance is a local-first Next.js PWA that lets you capture "節制利益" (money you chose not to spend) in the moment, track progress toward a savings goal, and stay motivated with lightweight mentor tips. The app prioritizes sub-second capture on mobile, offline support through IndexedDB (Dexie), and simple JSON backups you can move between devices.

## Key Features
- **ホーム**: Shows today's gain, cumulative totals, goal status (達成率・残額・予測到達日), line chart, quick CTA, and low-frequency mentor tips.
- **獲得**: Category presets grouped by domain plus a free-form form. Tapping logs immediately, offers a small amount editor, allows backdating via日付ピッカー, and shows an Undo toast.
- **履歴**: Day-grouped log list with totals, delete controls, and a日付編集モーダル to fix past entries.
- **設定**: Goal amount form, mentor frequency (1-3/day), preset CRUD, auto-add toggle for manual inputs, and JSON backup import/export.
- **PWA**: Manifest, icons, and a minimal service worker allow Android "ホーム画面に追加" and offline capture.

## Development
```bash
npm install
npm run dev       # start app on http://localhost:3000
npm run lint      # ESLint (app router + Tailwind 4)
npm run build     # production build
```

## Tech Notes
- **Next.js App Router + React 19** with a small layout shell optimized for max-width 420px.
- **State & Storage**: Dexie manages gains, presets, mentor metadata, and settings; hooks (`useGainLogs`, `usePresets`, `useSetting`) keep UI live via `dexie-react-hooks`.
- **Analytics helpers**: `lib/aggregates.ts` computes daily totals, cumulative chart points, progress %, remaining amount, and a 7-day average forecast.
- **Mentor tips**: `lib/tips.ts` enforces daily limits, randomness, and session handoff so tips can appear right after a gain.
- **Backup**: `lib/backup.ts` exports/imports JSON, wiping and restoring Dexie tables as needed.
- **PWA**: `app/manifest.ts` and `public/sw.js` provide the manifest/service worker; `PwaInstaller` registers it in production builds.

## Project Structure
```
data/                # presets.json, tips.json seeds
public/icons/        # PWA icons + sw.js
src/app/             # route files (home/add/history/settings, manifest)
src/components/      # UI, layout, feature views, providers
src/hooks/           # Dexie live queries
src/lib/             # Dexie DB, aggregates, formatters, tips, backup, actions
```

## Backup Format
`npm run dev` exposes the settings page where you can export a JSON file shaped like:
```json
{
  "version": "0.1",
  "exportedAt": "2025-02-08T00:00:00.000Z",
  "gains": [ { "amount": 1200, "label": "外食ランチ", ... } ],
  "presets": [ { "id": "food_lunch", "label": "外食ランチ", ... } ],
  "settings": { "goalAmount": 4000000, "mentorFrequency": 1, "mentorMeta": { ... } }
}
```
Importing replaces all Dexie tables and rehydrates defaults if any field is missing.

## Deployment
Deploy to Vercel as a static Next.js app. Ensure `NODE_ENV=production` so the service worker registers, then test:
1. Visit the app on Android Chrome.
2. Use "ホーム画面に追加" to pin the PWA.
3. Toggle airplane mode and confirm that logging from `/add` still updates the home dashboard after redirect.

