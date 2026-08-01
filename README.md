# Kose Food AI

飲食事業者向けサービス「Kose Food AI」の公式サイトです。素の HTML、CSS、JavaScript
で構成し、`site/` をそのまま Cloudflare Pages から配信します。ビルドはありません。

公開先は <https://food.kouheikosehira.com/> です。

## はじめる

Node.js 22 と pnpm 10.33.0 を用意してください。

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

ブラウザで <http://127.0.0.1:4173/> を開きます。

## 構成

| 場所 | 役割 |
|---|---|
| `site/` | 唯一の公開対象 |
| `site/index.html` | ページ構造と文言 |
| `site/assets/css/` | 見た目とレスポンシブ指定 |
| `site/assets/js/` | ES Modulesの画面機能 |
| `site/assets/lottie/` | PC・スマホのオープニング素材 |
| `docs/site/` | 保守・公開・設計資料 |
| `docs/roadmap.html` | 受入条件と進捗の正 |
| `scripts/` | 静的参照、Lottie、ロードマップの契約検査 |
| `tests/` | Node単体テストとPlaywright検査 |

## 品質チェック

```sh
pnpm run check
```

ブラウザを初めて使う場合だけ、先に次を実行します。

```sh
pnpm exec playwright install chromium
```

個別コマンドと変更箇所は
[`docs/site/MAINTENANCE.md`](docs/site/MAINTENANCE.md)、公開作業は
[`docs/site/DEPLOY.md`](docs/site/DEPLOY.md) を参照してください。

## 同居している Next.js モノレポ雛形

このリポジトリには、開発テンプレート `cc-v2` 由来の Next.js モノレポ雛形
（`apps/web`、`packages/ui`、`presets/`、`pnpm-workspace.yaml`、`tsconfig.base.json`）が
そのまま残してあります。**上記の公開サイトとは独立していて、本番の配信対象ではありません。**

コマンド名が衝突するため、雛形側は `web:` 接頭辞に寄せてあります。

| 静的サイト（既定） | Next.js 雛形 |
|---|---|
| `pnpm run dev` | `pnpm run web:dev` |
| `pnpm run lint` | `pnpm run web:lint` |
| `pnpm run test` | `pnpm run web:test` |
| （ビルド無し） | `pnpm run web:build` / `web:typecheck` / `web:start` |

CI（`.github/workflows/ci.yml`）は変更されたファイルを見て走らせ分けます。
静的サイトだけを直したときに Next.js のビルドを待たされることはありません。
