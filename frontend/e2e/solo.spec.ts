import { expect, test } from "@playwright/test";

test("Solo starten, Feld antippen, Eintrag-Overlay sichtbar", async ({ page }) => {
  await page.goto("/solo");

  await page.getByRole("button", { name: "Neues Spiel starten" }).click();
  await page.waitForURL(/\/play\?runId=/);

  await page.locator(".play-cell").first().click();
  await expect(page.locator("#score-entry-panel")).toBeVisible();
  await expect(page.locator("#field-entry-title")).toBeVisible();
});
