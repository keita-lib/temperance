# Vercel 再デプロイ手順とトラブルシューティング

## 1. 通常の再デプロイの流れ
1. **GitHubへpush** するだけで、自動的に Vercel のデプロイが走ります。
2. 成功すると「Deployments」タブに `Ready` 状態の新しいデプロイが作成されます。
3. `https://<project>.vercel.app` などの本番 URL にアクセスして動作確認します。

## 2. 自動デプロイが動かないときの対処
1. **Vercelの設定を確認**
   - Project Settings → Git → “Automatically Build and Deploy” が ON か確認。
   - Production Branch が `main` など、GitHub で push しているブランチと一致しているか確認。
2. **GitHub連携を再認証**
   - Vercel の Integrations → GitHub で「Reconfigure」ボタンを押してアクセス権を更新。
   - リポジトリのアクセス権が `keita-lib/temperance` に付与されているか確認。
3. **ビルドエラーの確認**
   - Deployments → 該当デプロイをクリックし、ログの「Failed」箇所を見る。
   - エラー内容（TypeScriptエラー・ESLintエラーなど）を修正して再 push。
4. **Auto Deploy が一時停止されていないか**
   - 失敗が続くと「Next deploys paused」という表示が出ることがあります。Resume ボタンがあれば押す。
5. **Deploy Hooks を使っている場合**
   - Deploy Hooks でのみトリガーする設定だと、自動で動きません。Project Settings → Deploy Hooks を確認。
6. **最終手段: プロジェクトを再インポート**
   - どうしても自動化できない場合は、Vercel のプロジェクトを削除→「Import Project」で同じ GitHub リポジトリを再インポート。設定がリセットされます。

## 3. 手動で再デプロイする方法
1. Vercel のダッシュボードで対象プロジェクトを開く。
2. 「Deployments」タブで最新版のデプロイを選ぶ。
3. 右上の「Redeploy」ボタンを押すと、同じコミットで再ビルドされます。
4. このとき「Use existing Build Cache」をONにすると多少早くなります。

## 4. よくある質問
- **Q. pushしても自動デプロイされない** → `git push` 先のブランチと Vercel の Production Branch が一致しているか確認。
- **Q. 途中から連携が切れた** → GitHub でトークンや権限を変更すると、Vercelが通知を受け取れなくなる。Integrations で再認証。
- **Q. 別リポジトリに変えたい** → Project Settings → Git → “Git Repository” で新しいリポジトリを指定、またはプロジェクトを作り直す。

## 5. ローカルで確認する場合
- デプロイ前に `npm run build` でエラーがないか確認。
- TypeScript エラーや lint エラーはローカルで解決してから push すると、Vercel で失敗しにくくなります。
  
これらをドキュメント化しておけば、また同じ問題が起きても落ち着いて対処できます。
