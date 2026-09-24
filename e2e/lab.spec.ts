import { test, expect } from "@playwright/test";
import { watchErrors } from "./errors";

// Internal comparison lab (app/lab/businesses): 404 on Vercel production.
test.skip(process.env.VERCEL_ENV === "production", "lab is not served in production");

for (const v of ["b", "c", "d", "e", "f"] as const) {
  test(`事業紹介ラボ ?v=${v} が表示され、コンソールエラーがない`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/lab/businesses?v=${v}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(`^${v.toUpperCase()}`) })).toHaveAttribute("aria-current", "page");

    const section = page.getByTestId(`lab-variant-${v}`);
    await expect(section).toBeAttached();
    // Scroll through the whole variant so every scroll-linked frame runs.
    await section.evaluate(async (el: HTMLElement) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      for (let f = 0; f <= 1; f += 0.1) {
        window.scrollTo(0, top + f * el.offsetHeight);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await expect(section.getByRole("heading", { level: 3 }).first()).toBeAttached();

    expect(errors()).toEqual([]);
  });
}

test("事業紹介ラボは noindex でサイトマップに載らない", async ({ page, request }) => {
  await page.goto("/lab/businesses?v=b");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).not.toContain("/lab/");
});
