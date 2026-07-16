import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished Spanish Lab home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Spanish Lab · DELE B2/);
  assert.match(html, /기출 유형을/);
  assert.match(html, /짧은 Tarea 연습/);
  assert.match(html, /Instituto Cervantes와 제휴·보증 관계가 없습니다/);
  assert.match(html, /og:image/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
  
  // Verify home starter link (Fix A regression check)
  assert.match(html, /href="([^"]*)\/practice\/set\/set-reading-/);
  assert.match(html, /class="block-link"/);
});

for (const [path, expected] of [
  ["/materials", "공식 자료실"],
  ["/practice", "짧게, 제대로 연습"],
  ["/exam", "실전처럼, 모의고사"],
  ["/exam/history", "모의고사 기록"],
  ["/exam/exam-listening-b2", "듣기 모의고사"],
  ["/review", "다시 보면, 내 것이 됩니다"],
  ["/guide", "B2 시험, 한국어로 한눈에"],
]) {
  test(`server-renders ${path}`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(expected));
  });
}

test("dev/worker build keeps internal links root-relative (no leaked base path)", async () => {
  // vinext dev/worker는 루트에서 서빙하므로, 빌드에 NEXT_PUBLIC_BASE_PATH가
  // 인라인되면 모든 내부 링크가 404가 된다. (.env.local에 두지 말 것)
  const response = await render();
  const html = await response.text();
  assert.match(html, /href="\/practice"/);
  assert.match(html, /href="\/materials"/);
  assert.doesNotMatch(html, /href="\/sldeleb2\//);
});

test("serves host-derived sitemap and robots metadata", async () => {
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type") ?? "", /application\/xml/);
  assert.match(await sitemap.text(), /(http:\/\/localhost(:3000)?|https:\/\/ywkinfo\.github\.io)\/practice/);

  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: (http:\/\/localhost(:3000)?|https:\/\/ywkinfo\.github\.io)\/sitemap\.xml/);
});

test("guide links every skill to practice and both auto-graded skills to exams", async () => {
  const response = await render("/guide");
  const html = await response.text();

  for (const skill of ["reading", "listening", "writing", "speaking"]) {
    assert.match(html, new RegExp(`href="/practice\\?skill=${skill}"`));
  }
  assert.match(html, /href="\/exam\/exam-reading-b2"/);
  assert.match(html, /href="\/exam\/exam-listening-b2"/);
});
