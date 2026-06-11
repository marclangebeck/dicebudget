import { expect, test } from "@playwright/test";

test("Multi-Join-Seite lädt und Code-Eingabe funktioniert", async ({ page }) => {
  await page.goto("/multi/join");

  await expect(page.getByText("Raum-Code vom Host")).toBeVisible();

  const codeInput = page.getByPlaceholder("z. B. ABCD2345");
  await expect(codeInput).toBeVisible();
  await codeInput.fill("abcd2345");
  await expect(codeInput).toHaveValue("ABCD2345");

  await page.getByRole("button", { name: "Zur Lobby" }).click();
  await page.waitForURL(/\/multi\/join\?code=ABCD2345/i);
});
