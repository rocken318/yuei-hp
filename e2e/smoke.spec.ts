import { test, expect } from "@playwright/test";
import { watchErrors } from "./errors";

test("トップが表示され、コンソールエラーがない", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const businesses = page.getByTestId("businesses");
  await businesses.scrollIntoViewIfNeeded();
  await expect(businesses).toBeVisible();
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");

  // Future-route prefetch 404s are allowed; anything else fails (e2e/errors.ts).
  expect(errors()).toEqual([]);
});

test("モバイルでメニューが開閉できる", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await expect(page.getByRole("navigation", { name: "モバイルメニュー" })).toBeVisible();
  await page.getByRole("button", { name: "メニューを閉じる" }).click();
  await expect(page.getByRole("navigation", { name: "モバイルメニュー" })).toBeHidden();
});

test("モバイルメニューが画面を覆い、フォーカス管理される", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "メニューを開く" });
  await toggle.click();

  const menu = page.getByRole("navigation", { name: "モバイルメニュー" });
  const container = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await expect(container).toBeVisible();
  // Disclosure pattern, not a dialog: no role="dialog"/aria-modal, so the
  // toggle button (outside this container) stays reachable to AT.
  await expect(container).not.toHaveAttribute("aria-modal");
  await expect(container).not.toHaveAttribute("role", "dialog");
  await expect(page.getByRole("button", { name: "メニューを閉じる" })).toHaveAttribute(
    "aria-controls",
    (await container.getAttribute("id")) ?? "",
  );

  // The menu must fill the viewport below the 64px header, not collapse
  // into the header's containing block.
  await expect
    .poll(async () => (await container.boundingBox())?.height ?? 0)
    .toBeGreaterThan(300);

  // Focus moves into the menu.
  await expect(menu.getByRole("link").first()).toBeFocused();

  // Background content is inert while open.
  await expect(page.locator("main")).toHaveAttribute("inert", "");

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "メニューを開く" })).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert");
});
