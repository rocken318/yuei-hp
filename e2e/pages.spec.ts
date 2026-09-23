import { readdirSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { watchErrors } from "./errors";

const CONTENT = path.join(__dirname, "..", "content");
const slugsIn = (dir: string, ext: string) =>
  readdirSync(path.join(CONTENT, dir))
    .filter((f) => f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length))
    .sort();

const BUSINESSES = slugsIn("businesses", ".json");
const VENUES = ["nightlife", "dining", "signage"].flatMap((b) => slugsIn(`venues/${b}`, ".mdx").map((v) => `${b}/${v}`));

const ROUTES = [
  "/about",
  "/business",
  ...BUSINESSES.map((b) => `/business/${b}`),
  ...VENUES.map((v) => `/business/${v}`),
];

/** Scrolls to the bottom in ~half-viewport steps so lazy images load. */
async function scrollToBottom(page: Page) {
  const vh = await page.evaluate(() => window.innerHeight);
  for (let y = 0; ; y += Math.round(vh / 2)) {
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.min(y, max);
    await page.evaluate((top) => window.scrollTo(0, top), target);
    await page.waitForTimeout(60);
    if (target >= max) break;
  }
  // Every image the scroll brought on screen has finished (loaded or failed);
  // lazy photos further along a horizontal gallery row never start.
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => {
      const r = img.getBoundingClientRect();
      return img.complete || r.width === 0 || r.right <= 0 || r.left >= window.innerWidth;
    }),
  );
}

test("content lists match the expected route set", () => {
  expect(BUSINESSES).toHaveLength(4);
  expect(VENUES).toHaveLength(9);
});

for (const route of ROUTES) {
  test(`${route} renders without errors or 404s`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Measure with the web fonts in place (fallback metrics differ).
    await page.evaluate(() => document.fonts.ready);

    // Nothing overflows the viewport horizontally (e.g. long katakana titles).
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await scrollToBottom(page);
    await expect(page.locator("footer").last()).toBeInViewport();
    expect(errors()).toEqual([]);
  });
}

test("/about shows the company table and the draft badge (non-production build)", async ({ page }) => {
  await page.goto("/about");
  const profile = page.getByTestId("company-profile");
  await profile.scrollIntoViewIfNeeded();
  await expect(profile.getByText("社名", { exact: true })).toBeVisible();
  const badge = page.getByTestId("draft-badge");
  await badge.scrollIntoViewIfNeeded();
  await expect(badge).toBeVisible();
});

test("big titles never break inside a part (Safari has no auto-phrase)", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  for (const route of ["/business/nightlife", "/business/digital", "/business/dining/danke"]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const parts = page.locator("h1 span.inline-block");
    expect(await parts.count(), route).toBeGreaterThan(1);
    const lines = await parts.evaluateAll((spans) =>
      spans.map((span) => {
        const range = document.createRange();
        range.selectNodeContents(span);
        const h1 = span.closest("h1")!.getBoundingClientRect();
        const r = span.getBoundingClientRect();
        return {
          text: span.textContent,
          boxes: span.getClientRects().length,
          // Text line boxes inside the part (an inline-block always has one
          // client rect, so also count the lines its text occupies).
          lines: new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top))).size,
          fits: r.left >= h1.left - 0.5 && r.right <= h1.right + 0.5,
        };
      }),
    );
    for (const l of lines) expect(l, `${route}: ${l.text}`).toEqual({ text: l.text, boxes: 1, lines: 1, fits: true });
  }
});

test("a single gallery photo equal to the hero is not repeated", async ({ page }) => {
  await page.goto("/business/signage/peace");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("GALLERY", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("swipe-gallery")).toHaveCount(0);
});

test.describe("venue gallery (/business/dining/en)", () => {
  test("swipes horizontally on phones and the counter follows", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/business/dining/en");
    const row = page.getByTestId("gallery-row");
    const counter = page.getByTestId("gallery-counter");
    await row.scrollIntoViewIfNeeded();
    // The hero photo is not repeated: 12 gallery photos − the hero = 11.
    await expect(counter).toHaveText("01 / 11");
    const before = await row.evaluate((el) => el.scrollLeft);
    await row.evaluate((el) => el.scrollBy({ left: el.clientWidth * 0.8, behavior: "instant" }));
    await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
    await expect(counter).not.toHaveText("01 / 11");
  });

  test("lightbox opens, moves with arrow keys, closes with Escape and returns focus to the photo shown last", async ({ page }) => {
    await page.goto("/business/dining/en");
    const row = page.getByTestId("gallery-row");
    await row.scrollIntoViewIfNeeded();
    await row.getByRole("button").first().click();

    const lightbox = page.getByTestId("lightbox");
    const counter = page.getByTestId("lightbox-counter");
    await expect(lightbox).toBeVisible();
    await expect(counter).toHaveText("01 / 11");
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText("02 / 11");

    // Focus goes back to the row item of the photo shown last (the 2nd).
    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
    await expect(row.getByRole("button").nth(1)).toBeFocused();
  });

  test("a tap on the lightbox stage closes it; the buttons don't", async ({ page }) => {
    await page.goto("/business/dining/en");
    const row = page.getByTestId("gallery-row");
    await row.scrollIntoViewIfNeeded();
    await row.getByRole("button").first().click();
    const lightbox = page.getByTestId("lightbox");
    await expect(lightbox).toBeVisible();
    await lightbox.getByRole("button", { name: "次の写真" }).click();
    await expect(page.getByTestId("lightbox-counter")).toHaveText("02 / 11");
    await expect(lightbox).toBeVisible();
    await page.getByTestId("lightbox-stage").click({ position: { x: 8, y: 8 } });
    await expect(lightbox).toBeHidden();
  });
});

test("header links to /about and /business resolve", async ({ page, isMobile }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  for (const [href, label] of [
    ["/about", "会社概要"],
    ["/business", "事業紹介"],
  ] as const) {
    if (isMobile) {
      await page.getByRole("button", { name: "メニューを開く" }).click();
      await page.getByRole("navigation", { name: "モバイルメニュー" }).getByRole("link", { name: label }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(errors()).toEqual([]);
});
