import { test, expect, type Page } from "@playwright/test";

/** Parsed JSON-LD blocks of the page. */
async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => JSON.parse(b));
}

test("/sitemap.xml lists the static, business, venue and news URLs", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of ["/about", "/recruit", "/business/nightlife", "/business/nightlife/kingyo", "/news/2026-09-24-site-open"]) {
    expect(xml).toContain(`${path}</loc>`);
  }
});

test("/robots.txt allows crawling and points at the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt).toContain("Allow: /");
  expect(txt).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
});

test("/opengraph-image is a PNG", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("home has exactly one JSON-LD block: the Organization", async ({ page }) => {
  await page.goto("/");
  const blocks = await jsonLd(page);
  expect(blocks).toHaveLength(1);
  expect(blocks[0]).toMatchObject({
    "@type": "Organization",
    name: "遊栄Japan株式会社",
    identifier: { propertyID: "法人番号", value: "4370001019890" },
  });
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("a venue page has canonical/og:url and a BreadcrumbList ending at itself (no LocalBusiness without an address)", async ({ page }) => {
  await page.goto("/business/nightlife/kingyo");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/business\/nightlife\/kingyo$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/business\/nightlife\/kingyo$/);
  const blocks = await jsonLd(page);
  expect(blocks.map((b) => b["@type"])).toEqual(["BreadcrumbList"]);
  const items = blocks[0].itemListElement as Array<{ name: string; item: string }>;
  expect(items.map((i) => i.name)).toEqual(["ホーム", "事業紹介", "ナイトエンターテインメント事業", "KINGYO"]);
  expect(items.at(-1)?.item).toMatch(/\/business\/nightlife\/kingyo$/);
});

test("store business CTAs don't claim open hiring", async ({ page }) => {
  for (const slug of ["nightlife", "dining"]) {
    await page.goto(`/business/${slug}`);
    await expect(page.getByText("採用情報は各店舗のサイトで公開予定です。")).toBeAttached();
    await expect(page.getByRole("link", { name: "採用について" })).toHaveAttribute("href", "/recruit");
    await expect(page.getByText(/仲間を求めています|募集/)).toHaveCount(0);
  }
});
