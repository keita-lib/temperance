# Temperance 開発の流れ（はじめての人向け）

はじめてプログラムを書く人でも分かるように、Temperance をどんな順番で作ったかまとめました。Git や GitHub の基本操作も書いてあるので、一緒に確認しながら進めていきましょう。

## 1. 土台づくり
1. ターミナルで `npx create-next-app@latest temperance` を実行し、Next.js プロジェクトを作成。
2. TypeScript と App Router を ON。`src/`・`public/`・`app/` などが自動でできあがる。
3. `SPEC.md`（仕様書）と `AGENTS.md`（開発ルール）を日本語で整備して、何を作るべきか明確にした。

## 2. アイコンやビジュアル
- `scripts/generate_icons.py` を作って、アプリのアイコンをプログラムで生成。
- 出来上がった PNG を `public/icons/` に置き、PWA（ホーム画面追加）でも使えるようにした。

## 3. 画面と機能
1. `/app/page.tsx`（ホーム）: 「今日の節制利益」「累積」「目標カード」「グラフ」「＋獲得ボタン」を配置。
2. `/app/add/page.tsx`（獲得）: プリセット一覧と自由入力フォームを用意。1タップで節制利益ログが保存できる。
3. Dexie を使って IndexedDB に `logs`・`presets`・`settings` を保存。`src/lib/db.ts` などに定義。

## 4. UX の工夫
- コイン演出 (`CoinRain`) を作り、獲得すると画面全体にコインが降るようにした。
- 着地するタイミングを計算して、その瞬間に効果音（`/public/audio/coin-chime.mp3`）が鳴るよう改善。
- 獲得直後に `/add` 画面に留まり、次の入力をすぐ行えるよう仕様変更。

## 5. バックアップや仕様メモ
- JSON のバックアップは設定画面から手動で行い、ブラウザのダウンロード先はユーザーが選ぶ方式に整理。
- `.gitignore` を追加し、`node_modules`、`.next`、`.env.local` など Git に不要なものはコミットしないようにした。

## 6. Git と GitHub の基本
ここでは **初めて Git を使う人** に向けた手順を書いています。

### 6.1 初期設定
1. **Git を初期化**: プロジェクトのルートで `git init` を実行。
2. **リモート (GitHub) を登録**:
   ```bash
   git remote add origin https://github.com/keita-lib/temperance.git
   ```
3. **ユーザー情報 (初回のみ)**:
   ```bash
   git config --global user.name "あなたの名前"
   git config --global user.email "メールアドレス"
   ```
4. **`.gitignore` を作る**: `node_modules`, `.next`, `.env.local` などを無視する設定を追加。

### 6.2 変更をコミットする流れ
1. `git status` で何が変わったか確認。
2. `git add .` で変更をステージ（ピックアップ）。特定のファイルだけなら `git add src/components/AddView.tsx` のように指定。
3. `git commit -m "メッセージ"` でコミットを作成。例: `git commit -m "feat: add coin landing SE"`

### 6.3 GitHub に送る（push）
1. 初回だけ `git push -u origin main`。これで「origin」という名前のリモートに `main` ブランチを送ります。
2. 2回目以降は `git push` だけで OK。

### 6.4 逆に取り込む（pull）
- 他の人が GitHub に push したので自分のローカルを更新したいときは `git pull --rebase origin main`。
- コンフリクト（`<<<<<<<` などが現れたら）→ 編集して印を消し、自分の望む内容に整えて `git add` → `git rebase --continue`。
- 途中でうまくいかないときは `git rebase --abort` で安全に戻れる。

### 6.5 権限エラーへの対処
- macOS で `Operation not permitted` になったら、`.git` フォルダの所有者が root になっていることが多い。
- `sudo chown -R keita /Users/keita/dev/temperance/.git` のように所有者を自分に戻すと解決する。

## 7. これからやる予定
- Vercel にデプロイしてスマホでも動作確認。
- Vitest + Testing Library で画面ごとのテストを書く。
- IndexedDB のバックアップ自動化など、仕様の追加検討。

わからないときは焦らず、`git status` と `git reflog`（過去の履歴一覧）を見ながら少しずつ進めるのがコツです。中学生でも、落ち着いて作業すればアプリ開発は十分できます。応援しています！
