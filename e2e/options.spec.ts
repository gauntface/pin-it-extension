import { expect, test, type Page } from "@playwright/test";

test("Options page", async ({ page }) => {
  await test.step("Navigate to options page", async () => {
    await page.goto("/options-mock.html");
  });

  await test.step("Check useful UI elements", async () => {
    await testUsefulUI(page);
  });

  await test.step("Test pinned tabs inputs", async () => {
    await testPinnedTabsInputs(page);
  });

  await test.step("Test auto-open tabs toggle", async () => {
    await testAutoOpenTabsToggle(page);
  });
});

async function testUsefulUI(page: Page) {
  await expect(page).toHaveTitle("Pin-It Extension Options");
  await expect(page.getByRole("heading", { name: "Options" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Learn more here" }),
  ).toBeVisible();
  await expect(page.getByLabel("Buy me a coffee")).toBeVisible();
}

async function testPinnedTabsInputs(page: Page) {
  const loading = await page.getByText("Loading");
  await expect(loading).not.toBeVisible();

  const firstInputElement = await page.getByPlaceholder("Enter a URL").nth(0);
  await expect(firstInputElement).toBeVisible();
  const firstDeleteButton = await page
    .getByRole("button", { name: "Delete" })
    .nth(0);
  await expect(firstDeleteButton).toBeVisible();

  const addURLButton = await page.getByRole("button", { name: "Add URL" });
  await expect(addURLButton).toBeVisible();

  // Check initial state
  await expect(firstInputElement).toHaveValue("");
  await expect(firstDeleteButton).toBeDisabled();

  // Test adding some text to first input
  await firstInputElement.fill("https://www.gaunt.dev");
  await expect(firstInputElement).toHaveValue("https://www.gaunt.dev");
  await expect(firstDeleteButton).toBeEnabled();

  // Test deleting the text
  await firstDeleteButton.click();
  await expect(firstInputElement).toHaveValue("");

  // Test adding some text and keeping it
  await firstInputElement.fill("https://www.gaunt.dev");
  await expect(firstInputElement).toHaveValue("https://www.gaunt.dev");
  await expect(firstDeleteButton).toBeEnabled();
  await expect(loading).toBeVisible();

  // Test adding a second input
  await addURLButton.click();

  const secondInputElement = await page.getByPlaceholder("Enter a URL").nth(1);
  await expect(secondInputElement).toBeVisible();

  const secondDeleteButton = await page
    .getByRole("button", { name: "Delete" })
    .nth(1);
  await expect(secondDeleteButton).toBeVisible();

  // Test filling the second input
  await secondInputElement.fill("https://www.gaunt.dev/projects/pin-it/");
  await expect(loading).toBeHidden({ timeout: 5000 });

  // Test deleting the first input
  await firstDeleteButton.click();

  // Only one input should be shown
  await expect(firstInputElement).toBeVisible();
  await expect(firstDeleteButton).toBeVisible();
  await expect(secondInputElement).not.toBeVisible();
  await expect(secondInputElement).not.toBeVisible();

  await expect(firstInputElement).toHaveValue(
    "https://www.gaunt.dev/projects/pin-it/",
  );
  await expect(firstDeleteButton).toBeEnabled();

  // Test deleting the first input
  await firstDeleteButton.click();
  await expect(firstInputElement).toBeVisible();
  await expect(firstDeleteButton).toBeVisible();
  await expect(firstInputElement).toHaveValue("");
  await expect(firstDeleteButton).toBeDisabled();
  await expect(loading).toBeHidden({ timeout: 5000 });
}

async function testAutoOpenTabsToggle(page: Page) {
  const loading = await page.getByText("Loading");
  await expect(loading).not.toBeVisible();

  const toggleLabel = await page.getByText(
    "Automatically open tabs when a new window is opened",
  );
  await expect(toggleLabel).toBeVisible();

  const checkbox = await page.getByTestId("auto-open-tabs-checkbox");
  await expect(checkbox).not.toBeChecked();

  await toggleLabel.click();
  await expect(checkbox).toBeChecked();

  await expect(loading).toBeVisible();
  await expect(loading).toBeHidden({ timeout: 5000 });

  await toggleLabel.click();
  await expect(checkbox).not.toBeChecked();

  await expect(loading).toBeVisible();
  await expect(loading).toBeHidden({ timeout: 5000 });
}

test("Reorder pinned tabs by dragging", async ({ page }) => {
  await page.goto("/options-mock.html");
  await expect(page.getByText("Loading")).not.toBeVisible();

  const inputs = page.getByPlaceholder("Enter a URL");
  const addURLButton = page.getByRole("button", { name: "Add URL" });
  await inputs.nth(0).fill("https://one.example");
  await addURLButton.click();
  await inputs.nth(1).fill("https://two.example");
  await addURLButton.click();
  await inputs.nth(2).fill("https://three.example");

  await page.evaluate(() => {
    window.addEventListener("dragstart", (e) => {
      document.body.dataset.dragTypes = [...(e.dataTransfer?.types ?? [])].join(
        ",",
      );
    });
  });

  await page
    .locator(".c-pinned-urls-list__draggable-grip")
    .nth(0)
    .dragTo(page.locator(".c-pinned-urls-list__draggable-container").nth(2));

  // Firefox does not start a drag unless dragstart sets some data.
  await expect(page.locator("body")).toHaveAttribute(
    "data-drag-types",
    /text\/plain/,
  );
  await expect(inputs.nth(0)).toHaveValue("https://two.example");
  await expect(inputs.nth(1)).toHaveValue("https://three.example");
  await expect(inputs.nth(2)).toHaveValue("https://one.example");
});
