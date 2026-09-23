import { test, expect, type Page } from "@playwright/test";

const SECTIONS = ["hero", "message", "businesses", "marquee", "signage", "numbers", "cta"] as const;

// Later plans add /about, /business, … — Link prefetch 404s for them are
// expected for now (see smoke.spec.ts). Anything else is a real error.
const isExpected404 = (text: string) => /Failed to load resource.*404/.test(text);

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return () => errors.filter((e) => !isExpected404(e));
}

/**
 * Scrolls to the bottom in ~1/3-viewport steps, pausing briefly after each,
 * and returns the testids of the sections that intersected the viewport.
 */
async function scrollThrough(page: Page) {
  const seen = new Set<string>();
  const vh = await page.evaluate(() => window.innerHeight);
  for (let y = 0; ; y += Math.round(vh / 3)) {
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.min(y, max);
    await page.evaluate((top) => window.scrollTo(0, top), target);
    await page.waitForTimeout(80);
    const inView = await page.evaluate((ids) => {
      return ids.filter((id) => {
        const r = document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect();
        return !!r && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
      });
    }, [...SECTIONS]);
    inView.forEach((id) => seen.add(id));
    if (target >= max) break;
  }
  return seen;
}

const wordOpacities = (page: Page) =>
  page
    .locator('[data-testid="message"] p > span[aria-hidden] > span')
    .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));

test.describe("home", () => {
  test("scrolling through shows every section, in order, without console errors", async ({ page }, info) => {
    const unexpectedErrors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Section order on the page.
    const tops = await Promise.all(
      SECTIONS.map((id) => page.getByTestId(id).evaluate((el) => el.getBoundingClientRect().top + window.scrollY)),
    );
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);

    if (info.project.name !== "mobile-reduced") {
      // Mid-message the later words are still dim (scroll-linked reveal runs).
      const message = page.getByTestId("message");
      await message.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 40));
      await expect.poll(async () => Math.min(...(await wordOpacities(page)))).toBeLessThan(0.5);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const seen = await scrollThrough(page);
    expect([...seen].sort()).toEqual([...SECTIONS].sort());

    // Having scrolled past it, every message word is fully revealed.
    await expect.poll(async () => Math.min(...(await wordOpacities(page)))).toBe(1);

    // The first figure counts up to the number of business domains.
    const numbers = page.getByTestId("numbers");
    await numbers.scrollIntoViewIfNeeded();
    await expect(numbers.locator("[data-ticker-count]").first()).toHaveText("4");

    for (const id of SECTIONS) await expect(page.getByTestId(id)).toBeVisible();
    await expect(page.getByTestId("cta")).toBeInViewport();

    expect(unexpectedErrors()).toEqual([]);
  });

  test("signage cards swipe horizontally on phones", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    const cards = page.getByTestId("signage-cards");
    await cards.scrollIntoViewIfNeeded();
    const before = await cards.evaluate((el) => el.scrollLeft);
    await cards.evaluate((el) => el.scrollBy({ left: el.clientWidth * 0.8, behavior: "instant" }));
    await expect.poll(() => cards.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
    await expect(page.getByTestId("signage-counter")).toContainText("02");
  });

  test("the hero mark starts scattered and assembles with scroll", async ({ page }, info) => {
    const reduced = info.project.name === "mobile-reduced";
    await page.goto("/");
    const mark = page.getByTestId("logo-mark");
    // Pieces fade in after mount.
    await expect.poll(() => mark.locator("[data-piece]").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

    const assembled = () =>
      mark.evaluate((box) => {
        const b = box.getBoundingClientRect();
        const slack = 4;
        return Array.from(box.querySelectorAll<HTMLElement>("[data-piece]")).every((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.left >= b.left - slack &&
            r.right <= b.right + slack &&
            r.top >= b.top - slack &&
            r.bottom <= b.bottom + slack
          );
        });
      });

    if (reduced) {
      // Reduced motion: assembled and static without any scrolling.
      expect(await assembled()).toBe(true);
      await expect(mark.locator("svg").first()).toHaveCSS("opacity", "1");
      await page.waitForTimeout(500);
      expect(await assembled()).toBe(true);
    } else {
      expect(await assembled()).toBe(false);
      const hero = page.getByTestId("hero");
      const vh = await page.evaluate(() => window.innerHeight);
      for (let y = 0; y <= vh; y += Math.round(vh / 4)) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(80);
      }
      await expect(hero).toBeVisible();
      await expect.poll(assembled).toBe(true);
    }
  });
});
