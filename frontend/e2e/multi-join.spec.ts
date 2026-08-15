import { expect, test } from "@playwright/test";

test("Multi-Join ohne Code zeigt QR-Scan statt Code-Eingabe", async ({ page }) => {
  await page.goto("/multi/join");

  await expect(page.getByRole("heading", { name: "Raum beitreten" })).toBeVisible();
  await expect(page.getByRole("button", { name: "QR-Code scannen" })).toBeVisible();
  await expect(page.getByPlaceholder("z. B. ABCD2345")).toHaveCount(0);
});

test("Multi-Join mit Code in der URL öffnet Lobby-Flow", async ({ page }) => {
  await page.goto("/multi/join?code=ABCD2345");

  await expect(page.getByText(/Code ABCD2345/i)).toBeVisible();
});
