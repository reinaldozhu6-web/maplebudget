const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "maplebudget_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.detail || "Request failed";
    throw new Error(formatApiError(message));
  }

  return data;
}

function formatApiError(message) {
  if (!Array.isArray(message)) {
    return message;
  }

  return message
    .map((item) => {
      const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
      return field ? `${field}: ${item.msg}` : item.msg;
    })
    .filter(Boolean)
    .join("; ") || "Validation failed";
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(email, password) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const data = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  setToken(data.access_token);
  return data;
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function getCurrentMonthSummary() {
  return request("/dashboard/current-month-summary");
}

export function getSpendingByCategory() {
  return request("/dashboard/current-month-spending-by-category");
}

export function getBudgetProgress() {
  return request("/dashboard/current-month-budget-progress");
}

export function getCategories() {
  return request("/categories");
}

export function createCategory(payload) {
  return request("/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getTransactions() {
  return request("/transactions");
}

export function createTransaction(payload) {
  return request("/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateTransaction(transactionId, payload) {
  return request(`/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(transactionId) {
  return request(`/transactions/${transactionId}`, {
    method: "DELETE",
  });
}

export function getBudgets() {
  return request("/budgets");
}

export function createBudget(payload) {
  return request("/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateBudget(budgetId, payload) {
  return request(`/budgets/${budgetId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteBudget(budgetId) {
  return request(`/budgets/${budgetId}`, {
    method: "DELETE",
  });
}
