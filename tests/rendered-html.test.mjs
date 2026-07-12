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
  ["/review", "다시 보면, 내 것이 됩니다"],
  ["/guide", "B2 시험, 한국어로 한눈에"],
]) {
  test(`server-renders ${path}`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(expected));
  });
}

test("serves host-derived sitemap and robots metadata", async () => {
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type") ?? "", /application\/xml/);
  assert.match(await sitemap.text(), /(http:\/\/localhost(:3000)?|https:\/\/ywkinfo\.github\.io)\/practice/);

  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: (http:\/\/localhost(:3000)?|https:\/\/ywkinfo\.github\.io)\/sitemap\.xml/);
});
