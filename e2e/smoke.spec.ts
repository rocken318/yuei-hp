import { test, expect } from "@playwright/test";

test("トップが表示され、コンソールエラーがない", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const businessPreview = page.getByTestId("business-preview");
  await businessPreview.scrollIntoViewIfNeeded();
  await expect(businessPreview).toBeVisible();
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");

  // Routes like /about, /business, /news, /recruit, /contact don't exist yet
  // at this stage of the build (later plans add them). Next.js Link prefetch
  // 404s for those routes are expected here and are not real bugs; filter
  // only messages that reference a failed-resource 404 so any other console
  // error — including one that merely mentions "404" in unrelated text —
  // still fails the test.
  const unexpected = errors.filter((e) => !/Failed to load resource.*404/.test(e));
  expect(unexpected).toEqual([]);
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
