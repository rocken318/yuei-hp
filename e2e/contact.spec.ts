import { test, expect } from "@playwright/test";
import { watchErrors } from "./errors";

// The e2e server runs without RESEND_API_KEY / CONTACT_TO, so the form is
// shown with the "準備中" notice and a disabled submit button. Submit-time
// validation and sending are covered by the unit tests (tests/contact).

test("/contact?type=web preselects Web制作 and shows the not-yet-accepting notice", async ({ page }) => {
  const errors = watchErrors(page);
  const res = await page.goto("/contact?type=web");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "お問い合わせ" })).toBeVisible();

  await expect(page.getByRole("radio", { name: /Web制作/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /サイネージ広告/ })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: /取材・その他/ })).not.toBeChecked();

  await expect(page.getByTestId("contact-disabled")).toContainText("現在、フォームからの送信は準備中です。");
  await expect(page.getByTestId("contact-submit")).toBeDisabled();

  // The privacy policy is linked from the consent checkbox.
  await expect(page.getByTestId("contact-form").getByRole("link", { name: /プライバシーポリシー/ })).toHaveAttribute(
    "href",
    "/privacy",
  );

  // Picking another type moves the selection.
  await page.getByTestId("contact-type-signage").click();
  await expect(page.getByRole("radio", { name: /サイネージ広告/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Web制作/ })).not.toBeChecked();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors()).toEqual([]);
});

test("/contact without a type selects nothing; required fields report errors on blur", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/contact?type=unknown");
  // Blur validation is client-side: let the page hydrate first.
  await page.waitForLoadState("networkidle");
  for (const name of [/サイネージ広告/, /Web制作/, /取材・その他/]) {
    await expect(page.getByRole("radio", { name })).not.toBeChecked();
  }

  const name = page.getByRole("textbox", { name: /お名前/ });
  const email = page.getByRole("textbox", { name: /メールアドレス/ });
  // Leave the name empty: tap it, then move on to the email field.
  await name.click();
  await email.click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  const describedBy = await name.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText("お名前を入力してください。");

  await email.fill("not-an-email");
  await email.blur();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("メールアドレスの形式が正しくありません。")).toBeVisible();

  // Fixing the value clears the error.
  await name.fill("山田 太郎");
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("お名前を入力してください。")).toHaveCount(0);

  expect(errors()).toEqual([]);
});

for (const [route, heading] of [
  ["/recruit", "採用情報"],
  ["/privacy", "個人情報保護方針"],
] as const) {
  test(`${route} renders without errors`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors()).toEqual([]);
  });
}

test("/recruit says postings will be on each store's site and links stores and contact", async ({ page }) => {
  await page.goto("/recruit");
  await expect(page.getByRole("heading", { level: 2, name: /採用情報は、\s*各店舗のサイトで\s*公開予定です。/ })).toBeVisible();
  await expect(page.getByText(/募集中/)).toHaveCount(0);
  const lists = page.getByTestId("venue-list");
  await expect(lists).toHaveCount(2);
  await expect(page.locator('[data-testid="venue-list"] a[href^="/business/nightlife/"]')).toHaveCount(3);
  await expect(page.locator('[data-testid="venue-list"] a[href^="/business/dining/"]')).toHaveCount(2);
  await expect(page.locator('main a[href="/contact?type=other"]')).toHaveCount(1);
});

test("/privacy lists the contact point with the company name and address", async ({ page }) => {
  await page.goto("/privacy");
  const contact = page.getByTestId("privacy-contact");
  await expect(contact).toContainText("株式会社");
  await expect(contact).toContainText("宮城県仙台市青葉区国分町");
  await expect(contact.getByRole("link", { name: "お問い合わせフォーム" })).toHaveAttribute("href", "/contact?type=other");
});
