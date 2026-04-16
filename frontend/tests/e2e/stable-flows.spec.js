import { expect, test } from "@playwright/test";

const userStamp = Date.now();
const user = {
  username: `e2euser${userStamp}`,
  email: `e2e-${userStamp}@example.com`,
  password: "StrongPassword123",
};

const categoryName = `Groceries ${userStamp}`;
const transactionNote = `Weekly groceries ${userStamp}`;
const budgetAmount = "650.00";
const transactionAmount = "42.50";

test.describe.serial("stable MapleBudget flows", () => {
  test("registers a new account", async ({ page }) => {
    await page.goto("/register");

    const form = page.getByTestId("register-form");
    await form.getByLabel("Username").fill(user.username);
    await form.getByLabel("Email").fill(user.email);
    await form.getByLabel("Password").fill(user.password);
    await form.getByLabel("Currency").fill("CAD");
    await form.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Financial dashboard" })).toBeVisible();
  });

  test("logs out and logs back in", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/login$/);

    const form = page.getByTestId("login-form");
    await form.getByLabel("Email").fill(user.email);
    await form.getByLabel("Password").fill(user.password);
    await form.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test("creates a category", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Categories" }).first().click();

    const form = page.getByTestId("category-form");
    await form.getByLabel("Name").fill(categoryName);
    await form.getByLabel("Type").selectOption("expense");
    await form.getByLabel("Icon label").fill("cart");
    await form.getByRole("button", { name: "Create category" }).click();

    await expect(page.getByText("Category created.")).toBeVisible();
    await expect(page.getByTestId("category-row").filter({ hasText: categoryName })).toBeVisible();
  });

  test("creates a transaction", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Transactions" }).first().click();

    const form = page.getByTestId("transaction-form");
    await form.getByLabel("Amount").fill(transactionAmount);
    await form.getByLabel("Date").fill("2026-04-16");
    await form.getByLabel("Type").selectOption("expense");
    await form.getByLabel("Category").selectOption({ label: categoryName });
    await form.getByLabel("Note").fill(transactionNote);
    await form.getByRole("button", { name: "Create transaction" }).click();

    await expect(page.getByText("Transaction created.")).toBeVisible();
    await expect(page.getByTestId("transaction-row").filter({ hasText: transactionNote })).toBeVisible();
    await expect(page.getByTestId("transaction-row").filter({ hasText: categoryName })).toBeVisible();
  });

  test("creates a budget", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Budgets" }).first().click();

    const form = page.getByTestId("budget-form");
    await form.getByLabel("Amount").fill(budgetAmount);
    await form.getByLabel("Month").selectOption("4");
    await form.getByLabel("Year").fill("2026");
    await form.getByLabel("Category").selectOption({ label: categoryName });
    await form.getByRole("button", { name: "Create budget" }).click();

    await expect(page.getByText("Budget created.")).toBeVisible();
    await expect(page.getByTestId("budget-row").filter({ hasText: categoryName })).toBeVisible();
    await expect(page.getByTestId("budget-row").filter({ hasText: "$650.00" })).toBeVisible();
  });

  test("shows created data on the dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Financial dashboard" })).toBeVisible();
    await expect(page.getByText(categoryName).first()).toBeVisible();
    await expect(
      page.getByTestId("recent-transaction").filter({ hasText: transactionNote }),
    ).toContainText("CA$42.50");
    await expect(
      page.getByTestId("budget-risk").filter({ hasText: categoryName }),
    ).toContainText("CA$650.00");
  });

  test("logs out", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("login-form")).toBeVisible();
  });
});

async function login(page) {
  await page.goto("/login");

  const form = page.getByTestId("login-form");
  await form.getByLabel("Email").fill(user.email);
  await form.getByLabel("Password").fill(user.password);
  await form.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
}
