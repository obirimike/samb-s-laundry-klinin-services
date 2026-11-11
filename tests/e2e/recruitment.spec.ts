import { expect, test } from "@playwright/test";

test.describe("Recruitment & Careers Portal", () => {
  test("careers landing page loads with hero, links and explorer", async ({ page }) => {
    await page.goto("/careers");
    await expect(
      page.getByRole("heading", { name: "Build your career with SAMB" })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Submit General Application" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Track Existing Application" }).first()
    ).toBeVisible();
  });

  test("general application page displays form controls and validation", async ({ page }) => {
    await page.goto("/careers/apply");
    await expect(
      page.getByRole("heading", { name: "Join the SAMB&apos;s Team" })
    ).toBeVisible();

    // Check key form elements
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/Phone Number/i)).toBeVisible();
    await expect(page.getByLabel(/Current Location/i)).toBeVisible();
    await expect(page.getByLabel(/Cover Letter/i)).toBeVisible();

    // Click submit without filling fields to test client validation
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(
      page.getByText("Please enter your full name")
    ).toBeVisible();
  });

  test("application tracking page displays search interface and accepts input", async ({ page }) => {
    await page.goto("/careers/track");
    await expect(
      page.getByRole("heading", { name: "Track Your Application" })
    ).toBeVisible();

    await expect(
      page.getByLabel("Application Reference Number")
    ).toBeVisible();
    await expect(
      page.getByLabel("Applicant Email Address")
    ).toBeVisible();

    // Fill non-existent reference and verify error handling
    await page.getByLabel("Application Reference Number").fill("SAMB-APP-202611-XXXX");
    await page.getByLabel("Applicant Email Address").fill("nonexistent@example.com");
    await page.getByRole("button", { name: "Find Application" }).click();

    await expect(
      page.getByText(/No application was found|Unable to find/i)
    ).toBeVisible();
  });
});
