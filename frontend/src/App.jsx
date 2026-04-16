import { useEffect, useMemo, useState } from "react";

import {
  clearToken,
  getBudgetProgress,
  getCurrentMonthSummary,
  getCurrentUser,
  getSpendingByCategory,
  getToken,
  loginUser,
  registerUser,
} from "./api.js";

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
}

function routeFromPath() {
  const path = window.location.pathname;
  if (path === "/register") {
    return "register";
  }
  if (path === "/dashboard") {
    return "dashboard";
  }
  return "login";
}

function navigate(route) {
  const path = route === "dashboard" ? "/dashboard" : route === "register" ? "/register" : "/login";
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("maplebudget:navigate"));
}

function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <section className="brand-panel">
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
          alt="Budget planning notebook"
        />
        <div>
          <p className="eyebrow">MapleBudget</p>
          <h1>Know what came in, what went out, and what is left.</h1>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginUser(email, password);
      await onLogin();
      navigate("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
        <p>
          New here?{" "}
          <button className="link-button" type="button" onClick={() => navigate("register")}>
            Create an account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

function RegisterPage({ onRegister }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    default_currency: "CAD",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await registerUser(form);
      await loginUser(form.email, form.password);
      await onRegister();
      navigate("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Create account</h2>
        <label>
          Username
          <input
            autoComplete="username"
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            required
          />
        </label>
        <label>
          Currency
          <input
            value={form.default_currency}
            onChange={(event) => updateField("default_currency", event.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
        <p>
          Already have an account?{" "}
          <button className="link-button" type="button" onClick={() => navigate("login")}>
            Log in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

function DashboardPage({ user, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [spending, setSpending] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setError("");
      setIsLoading(true);

      try {
        const [summaryData, spendingData, budgetData] = await Promise.all([
          getCurrentMonthSummary(),
          getSpendingByCategory(),
          getBudgetProgress(),
        ]);

        if (isActive) {
          setSummary(summaryData);
          setSpending(spendingData);
          setBudgetProgress(budgetData);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">MapleBudget</p>
          <h1>Dashboard</h1>
        </div>
        <div className="account-actions">
          <span>{user?.email}</span>
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {isLoading && <p className="muted">Loading dashboard...</p>}

      {summary && (
        <>
          <section className="summary-grid">
            <article>
              <span>Income</span>
              <strong>{formatMoney(summary.income_total)}</strong>
            </article>
            <article>
              <span>Expenses</span>
              <strong>{formatMoney(summary.expense_total)}</strong>
            </article>
            <article>
              <span>Net balance</span>
              <strong>{formatMoney(summary.net_balance)}</strong>
            </article>
          </section>

          <section className="content-grid">
            <DashboardSection title="Spending by category">
              {spending.length === 0 ? (
                <p className="muted">No spending recorded this month.</p>
              ) : (
                <div className="list">
                  {spending.map((item) => (
                    <div className="list-row" key={item.category_id ?? "uncategorized"}>
                      <span>{item.category_name || "Uncategorized"}</span>
                      <strong>{formatMoney(item.total)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>

            <DashboardSection title="Budget progress">
              {budgetProgress.length === 0 ? (
                <p className="muted">No budgets set for this month.</p>
              ) : (
                <div className="list">
                  {budgetProgress.map((item) => (
                    <div className="budget-row" key={item.budget_id}>
                      <div className="list-row">
                        <span>{item.category_name || "Overall budget"}</span>
                        <strong>
                          {formatMoney(item.spent_amount)} / {formatMoney(item.budget_amount)}
                        </strong>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{
                            width: `${Math.min(Number(item.percent_used), 100)}%`,
                          }}
                        />
                      </div>
                      <p className="muted">{item.percent_used}% used</p>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>
          </section>
        </>
      )}
    </main>
  );
}

function DashboardSection({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState(routeFromPath);
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    function handleNavigation() {
      setRoute(routeFromPath());
    }

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("maplebudget:navigate", handleNavigation);
    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("maplebudget:navigate", handleNavigation);
    };
  }, []);

  async function loadUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  useEffect(() => {
    async function checkSession() {
      if (!getToken()) {
        setIsCheckingSession(false);
        if (route === "dashboard") {
          navigate("login");
        }
        return;
      }

      try {
        await loadUser();
        if (route !== "register") {
          navigate("dashboard");
        }
      } catch {
        clearToken();
        setUser(null);
        navigate("login");
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    navigate("login");
  }

  if (isCheckingSession) {
    return <main className="loading-screen">Loading MapleBudget...</main>;
  }

  if (route === "dashboard") {
    if (!isAuthenticated) {
      navigate("login");
      return null;
    }
    return <DashboardPage user={user} onLogout={handleLogout} />;
  }

  if (route === "register") {
    return <RegisterPage onRegister={loadUser} />;
  }

  return <LoginPage onLogin={loadUser} />;
}
