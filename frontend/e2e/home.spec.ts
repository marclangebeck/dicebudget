import { expect, test } from "@playwright/test";

test("Landingpage ohne Web-App-CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Echte Würfel. Echte Taktik. Eure Serie.",
  );
  await expect(page.getByRole("link", { name: "In der Web-App öffnen" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Als Beta testen" })).toBeVisible();
});

test("/app leitet im Browser nicht zum Spiel-Startscreen", async ({ page }) => {
  await page.goto("/app");

  await expect(page.locator(".home-cinematic")).toHaveCount(0);
  await expect(page.locator(".home-play-arena")).toHaveCount(0);

  await page.waitForURL(/apps\.apple\.com\/app\/dicebudget-strategy-edition\//, {
    timeout: 15_000,
  });
});
