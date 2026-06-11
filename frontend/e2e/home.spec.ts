import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("dicebudget.introShown.v2", "1");
  });
});

test("Startscreen /app rendert Cinematic oder Classic", async ({ page }) => {
  await page.goto("/app");

  const cinematic = page.locator(".home-cinematic");
  const classic = page.locator(".home-play-arena");
  await expect(cinematic.or(classic)).toBeVisible();

  const multiCta = page.getByRole("link", { name: /Lobby öffnen/i });
  const soloCta = page.getByRole("link", { name: /Run starten/i });
  await expect(multiCta).toBeVisible();
  await expect(soloCta).toBeVisible();
});
