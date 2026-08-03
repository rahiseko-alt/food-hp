import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// このリポジトリには2つの成果物が同居している。
//   - 静的サイト site/（ビルド無し。Cloudflare Pages が配信する本番の製品）
//   - Next.js モノレポ雛形 apps/ packages/ presets/（cc-v2 由来。まだ製品ではない）
// 引っ越し前（rahiseko-alt/kose-food-ai-hp）は「静的サイト専用で、雛形は消えていること」を
// ここで機械的に守っていた。併置する構成に変えたので、守る対象を差し替えてある。
// 新しい守り所は「雛形のコマンドが静的サイトのコマンドを覆い隠さないこと」。
// 覆い隠されると `pnpm run lint` が site/ を見なくなり、検査が素通りする。

test("the root package is pinned to the static-site toolchain", () => {
  const packageJson = readJson("package.json");

  assert.equal(packageJson.name, "food-hp");
  assert.equal(packageJson.packageManager, "pnpm@10.33.0");
  assert.equal(packageJson.type, "module");

  // 既定のコマンドは静的サイト側を指すこと（雛形の `pnpm -r ...` に乗っ取られていないこと）。
  assert.match(packageJson.scripts.dev, /scripts\/serve-site\.mjs/);
  assert.match(packageJson.scripts.lint, /lint:html/);
  assert.match(packageJson.scripts["lint:html"], /site\//);
  assert.match(packageJson.scripts["lint:css"], /site\//);
  assert.match(packageJson.scripts["lint:js"], /site\/assets\/js/);
  assert.match(packageJson.scripts.test, /test:unit/);

  // ルートに build を生やさない（静的サイトはビルドしない。雛形側は web:build に隔離する）。
  assert.equal(packageJson.scripts.build, undefined);

  // 静的サイトの契約検査が全部そろっていること。
  for (const script of [
    "verify:references",
    "verify:lottie",
    "verify:asset-version",
    "verify:i18n",
    "verify:roadmap",
  ]) {
    assert.ok(packageJson.scripts[script], `${script} が package.json から失われています`);
  }
});

test("the Next.js template stays behind the web: prefix", () => {
  const packageJson = readJson("package.json");

  // 雛形は消さずに残す。ただし必ず web: 接頭辞の下に置き、既定コマンドを奪わせない。
  for (const script of ["web:dev", "web:start", "web:build", "web:lint", "web:test", "web:typecheck"]) {
    assert.ok(packageJson.scripts[script], `${script} が package.json から失われています`);
    assert.match(packageJson.scripts[script], /pnpm (-r|--filter web) /);
  }

  // 雛形の実体が消えていないこと（消したなら web: のコマンドも一緒に消すこと）。
  for (const path of ["apps/web", "packages/ui", "pnpm-workspace.yaml", "tsconfig.base.json"]) {
    assert.equal(existsSync(path), true, `${path} が失われています`);
  }
});

test("the publish target stays site/ and nothing else", () => {
  // Cloudflare Pages の Build output directory は `site`。ここが崩れると本番が空になる。
  assert.equal(existsSync("site/index.html"), true);
  assert.equal(existsSync("site/_headers"), true);

  // 雛形のビルド成果物が公開対象に紛れ込んでいないこと。
  for (const path of ["site/.next", "site/node_modules", "site/out"]) {
    assert.equal(existsSync(path), false, `${path} が公開対象に紛れ込んでいます`);
  }
});

test("deployment documentation separates the repository and Pages names", () => {
  const deploy = readFileSync("docs/site/DEPLOY.md", "utf8");

  // GitHub リポジトリ名と Cloudflare Pages のプロジェクト名は別物。混同すると接続先を間違える。
  assert.match(deploy, /rahiseko-alt\/food-hp/);
  assert.match(deploy, /Cloudflare Pages.+`ai-food-company`/s);
  assert.doesNotMatch(deploy, /rahiseko-alt\/ai-food-company/);

  // Git 接続の張り替え（Disconnect→Connect）は、次に別リポジトリへ引っ越すときも必ず要る
  // 人の手作業。手順そのものを手順書から消さないこと（「確認する」に後退させない）。
  assert.match(deploy, /Disconnect/);
  assert.match(deploy, /Connect/);
  assert.match(deploy, /Build output directory/);

  // 切り替わったことを目視ではなく外部事実（配信中の ?v= の値）で確認する手順を残すこと。
  assert.match(deploy, /site\.css\?v=/);
});
