# 公開手順（Cloudflare Pages）

- **公開先** … `https://food.kouheikosehira.com/`
- **GitHub** … `rahiseko-alt/food-hp`（2026-08-01 に `rahiseko-alt/kose-food-ai-hp` から引っ越した）
- **Cloudflare Pages のプロジェクト名** … `ai-food-company`
- **リポジトリ内の場所** … 配信するファイルは **`site/`** に置いてある
  （`site/index.html` ＋ `site/assets/` ＋ `site/_headers`）。`site/` の外にあるものは公開されない。
- **配信するもの** … `site/` の静的ファイル一式。ビルドや単一HTMLへの変換は行わない

## 調べて確定していること（2026-07-30 時点のDNS実測）

| 項目 | 状態 |
|---|---|
| `kouheikosehira.com` のネームサーバー | **Cloudflare**（`anton.ns.cloudflare.com` / `becky.ns.cloudflare.com`） |
| apex と `www` | ともに `76.76.21.21` ＝ **Vercel**。既存サイトが載っているので触らない |
| メール | **Google Workspace**（MX `aspmx.l.google.com` ほか、SPFあり）。**MXは絶対に触らない** |
| `food.kouheikosehira.com` | **未使用**（NXDOMAIN）。ここに載せれば既存サイトもメールも無傷 |

DNSがすでに Cloudflare なので、サブドメインのレコードは Pages 側から自動で作られる。
手でDNSを編集する必要はない。

---

## 1. GitHub に置く

Cloudflare Pages は GitHub リポジトリを見て自動公開する。

配信ファイルは `rahiseko-alt/food-hp` の `site/` に入っている。
プルリクエストを `main` にマージした時点で、この手順に進める状態になる。

```sh
git push -u origin <作業ブランチ>
# → GitHub でプルリクエストを作り、CI（ci-green）が緑になったらマージする
```

---

## 2. Cloudflare Pages の Git 接続を張り替える

**2026-08-01 の引っ越し（kose-food-ai-hp → food-hp）で実際に行った手順。** この張り替えは
Cloudflare ダッシュボード上の人の手作業で、AI 側からは実行できない（API トークンが無い）。
以下は「確認する」ではなく「張り替える」実施済みの手順そのもの。

### 2-1. プロジェクトを開く（検索・左ナビが効かないことがある）

新ダッシュボードでは、左ナビの検索や「Workers & Pages」一覧に `ai-food-company` が
**出てこないことがある**（2026-08-01 に実際に発生。同一アカウントなのに一覧・検索の両方に
出なかった）。その場合は URL を直接開く。

```
https://dash.cloudflare.com/<アカウントID>/pages/view/ai-food-company
```

アカウントID は過去の CI ログ（`prod-smoke.yml` の run URL 等）や、ダッシュボードの
どのページでもよいので一度開いたときの URL から拾える（`dash.cloudflare.com/<32桁の16進数>/...`）。

> **接続済みリポジトリの表示名が古いことがある。** プロジェクト画面右上や
> Settings の「Git repository」欄に、実際とは違うリポジトリ名（例：`ai-food-company` という
> 名前自体）が表示されることがある。GitHub 側でリポジトリを改名した場合に Cloudflare 側の
> 表示が追従していないだけで、**実体は正しいプロジェクトである**ことが多い。
> 迷ったら Deployments タブでデプロイ元のコミット SHA を見て、GitHub の実際のコミット
> （マージした PR のマージコミット SHA）と一致するかで実体を確認する。

### 2-2. 接続を切って、繋ぎ直す

1. プロジェクトを開いたら **Settings → Build** タブに入る
2. **Git repository** 欄の **Disconnect** を押す
   （確認ダイアログが出るが「今後 push しても自動デプロイされなくなる」という意味だけで、
   **既存の公開内容は消えない**。安全に押してよい）
3. 同じ欄に出る **Connect** を押す
4. **Git account** → 対象の GitHub アカウント、**Repository** → **`food-hp`** を選ぶ
5. **Production branch** は `main` のまま
6. **Build configuration** に次の値を入れる（ビルド不要の静的サイト）

   | 項目 | 値 |
   |---|---|
   | Framework preset | None |
   | Build command | （空欄） |
   | Build output directory | **`site`** ← ここだけ空欄ではなく指定する |
   | Root directory | （空欄） |

   ⚠ **Build output directory を `site` にすること**。`/`（リポジトリ直下）にすると
   リポジトリ内の運用ファイル（`AGENTS.md` や `docs/`）まで配信されてしまう。

7. **Connect** を押すと自動で1回ビルド・デプロイが走る

### 2-3. 切り替わったことを外部事実で確認する

カスタムドメイン `food.kouheikosehira.com` は接続先の張り替えだけでは引き継がれない
デプロイ内容が反映されて初めて新リポジトリの中身になる。自己申告（見た目の確認）ではなく、
外部から機械的に判定できる目印を使う：

```sh
curl -s https://food.kouheikosehira.com/ | grep -o 'site.css?v=[^"]*'
```

デプロイ済みリポジトリの `site/index.html` の `?v=` と一致すれば切り替え完了。
2026-08-01 の実施では旧リポジトリの `2026-08-01b` から新リポジトリの `2026-08-01c` への
切り替わりを、この方法で確認した。

---

## 3. サブドメインを繋ぐ

1. Pages のプロジェクト → **Custom domains → Set up a domain**
2. `food.kouheikosehira.com` を入力
3. 同一アカウントにゾーンがあるので、確認画面で承認すると **CNAMEが自動で作られる**
4. HTTPS証明書も自動発行。反映は数分〜最大1時間

apex と `www` のレコードには触らないこと（Vercelの既存サイトが落ちる）。
MXレコードにも触らないこと（`info@` のメールが止まる）。

---

## 4. フォームを有効化する（公開直後に1回だけ）

送信先は **FormSubmit**（登録不要）で `info@kouheikosehira.com` に配線済み。

```html
data-endpoint="https://formsubmit.co/ajax/info@kouheikosehira.com"
action="https://formsubmit.co/info@kouheikosehira.com"
```

**初回だけ有効化が必要**：公開後に自分でフォームを1回送信すると
`info@kouheikosehira.com` に確認メールが届く。その中のリンクを押すと以後は
通常どおり届く。押すまでは送信内容がメールになりません。

送られる項目：

| name | 内容 |
|---|---|
| `store` | 店名 / 会社名（必須） |
| `name` | お名前（必須） |
| `contact` | 連絡先（必須） |
| `detail` | いま困っていること（任意） |

### アドレスを隠したい場合

いまはHTMLに `info@kouheikosehira.com` が書かれているので、スパム収集に拾われる。
有効化後、FormSubmit の管理画面で発行される別名エンドポイント
（`https://formsubmit.co/el/xxxxxx` の形）に差し替えれば隠せる。
`data-endpoint` は `https://formsubmit.co/ajax/el/xxxxxx` になる。

管理画面や送信履歴が欲しいなら Formspree（無料枠 月50件）に替えてもよい。
`index.html` の2箇所のURLを差し替えるだけで動く。

---

## 5. 公開前に直す仮の文言

公開すると以下はすべて「お店の約束」として読まれる。`index.html` を検索して直すこと。

（以下の「場所」は `site/index.html` の中）

| 現在の文言 | 場所 |
|---|---|
| 初回相談は無料 | 相談セクションの定義リスト |
| 営業日24時間以内（返信） | 同上 |
| オンライン30分／来店・訪問（岐阜・愛知） | 同上 |
| オンライン30分／来店も可・岐阜県内は訪問可 | Menu 内 CTA の脇 |
| 概算費用、使える補助金までその場でお答えします | Menu 内 CTA の本文 |
| お急ぎの場合はお電話でも受け付けます（平日10:00–18:00） | フォーム下 |

未対応：

- 上部バーの「お問合せ ›」とナビ（ホーム／よくある質問）は**リンクしていない**。
  `#contact` へ繋ぐか、項目を削るか決める
- OG画像（SNSでシェアされたときの画像、1200×630）が未支給。
  用意できれば `site/index.html` の `og:image` を追加する

---

## 6. 公開後の更新

```sh
git add -A && git commit -m "..." && git push
# → Cloudflare Pages が自動で再公開
```

`assets/` は1年キャッシュの設定（`_headers`）なので、画像や Lottie を差し替えたときは
Pages の **Deployments → Manage → Purge cache** を実行するか、ファイル名を変える。

`site/assets/css/*.css` と `site/assets/js/*.mjs` の中身を変えたときは、キャッシュのパージでは
不十分（公開前から開いていた人のブラウザには一生届かない）。必ず `docs/site/MAINTENANCE.md`
「CSS/JSのキャッシュを更新する（?v=）」の手順で `?v=` を上げる（`pnpm run verify:asset-version`
で機械チェックできる）。

---

## 7. 公開できたことを機械で確かめる

自己申告ではなく外部事実で確かめる。GitHub の **Actions → prod-smoke → Run workflow** を実行する。
中でやっているのは3つで、いずれも実機（GitHub Actions）から本番URLとDNSを叩いている。

| 検査 | 内容 |
|---|---|
| prod 200 + marker | `https://food.kouheikosehira.com` が 200 で、本文に `Kose Food AI` を含む |
| 公開アセット | CSS / ES Modules / Lottie / 壁紙が本番で 200 |
| アセットの `?v=` | 本番HTMLが参照する `?v=` 付きCSS/JS URLが実際に本番で 200 |
| フォーム導線 | 問い合わせ欄と送信フォームが公開HTMLに存在する |
| DNS 無傷 | apex の A レコードが生きていて、MX が Google Workspace のまま |

緑になった **run の URL** を `docs/roadmap.html` の該当 criteria の `evidence` に貼る。
（`prod-smoke` は手動実行のみ。公開前に自動で回すと必ず赤くなるため）
