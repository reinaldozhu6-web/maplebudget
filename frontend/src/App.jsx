import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LineChart,
  LogOut,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  clearToken,
  createBudget,
  createCategory,
  createTransaction,
  deleteBudget,
  deleteTransaction,
  getBudgetProgress,
  getBudgets,
  getCategories,
  getCurrentMonthSummary,
  getCurrentUser,
  getSpendingByCategory,
  getToken,
  getTransactions,
  loginUser,
  registerUser,
  updateBudget,
  updateTransaction,
} from "./api.js";
import { Badge } from "./components/ui/badge.jsx";
import { Button } from "./components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Label } from "./components/ui/label.jsx";
import { Progress } from "./components/ui/progress.jsx";
import { Separator } from "./components/ui/separator.jsx";
import { cn } from "./lib/utils.js";

const APP_ROUTES = ["dashboard", "transactions", "budgets", "categories"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthForm() {
  const today = new Date();
  return {
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
  };
}

function defaultTransactionFilters() {
  return {
    type: "all",
    category_id: "all",
    start_date: "",
    end_date: "",
  };
}

function defaultBudgetFilters() {
  return {
    month: "all",
    year: String(new Date().getFullYear()),
  };
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
}

function formatPeriod(month, year) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function isPositiveAmount(value) {
  return Number(value) > 0;
}

function categoryLabel(categories, categoryId, fallback = "Uncategorized") {
  if (!categoryId) {
    return fallback;
  }
  return categories.find((category) => category.id === Number(categoryId))?.name || fallback;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function routeFromPath() {
  const route = window.location.pathname.replace("/", "");
  if (route === "register") {
    return "register";
  }
  if (APP_ROUTES.includes(route)) {
    return route;
  }
  return "login";
}

function navigate(route) {
  const path = APP_ROUTES.includes(route)
    ? `/${route}`
    : route === "register"
      ? "/register"
      : "/login";
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("maplebudget:navigate"));
}

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
        <WalletCards className="h-5 w-5" />
      </div>
      {!compact && (
        <div>
          <p className="text-base font-bold leading-none tracking-normal">MapleBudget</p>
          <p className="text-xs text-muted-foreground">Personal finance workspace</p>
        </div>
      )}
    </div>
  );
}

function ErrorMessage({ children }) {
  if (!children) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
      {children}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{children}</p>;
}

function SuccessMessage({ children }) {
  if (!children) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      {children}
    </div>
  );
}

function InlineHint({ actionLabel, children, onAction }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
      <p>{children}</p>
      {actionLabel && onAction && (
        <Button className="mt-3" variant="outline" size="sm" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function SelectField({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function AuthLayout({ children, mode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.2fr)_minmax(520px,0.8fr)]">
        <section className="mesh-panel shine-edge hidden min-h-screen p-8 text-white lg:flex">
          <div className="relative z-10 flex w-full flex-col justify-between">
            <BrandMark />

            <div className="max-w-3xl pb-8">
              <Badge className="mb-6 border-white/30 bg-white/15 text-white">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Built for monthly money clarity
              </Badge>
              <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-normal xl:text-6xl">
                Run your budget from one calm financial workspace.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">
                Track income, spending, budgets, and category health with a dashboard
                that keeps the next decision obvious.
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                <AuthStat label="Monthly view" value="Live" />
                <AuthStat label="Budget focus" value="Clear" />
                <AuthStat label="Currency" value="CAD" />
              </div>
            </div>
          </div>
        </section>

        <section className="subtle-grid flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <BrandMark />
              <Badge variant="outline">{mode === "register" ? "Create" : "Secure"}</Badge>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/12 p-4 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-normal text-white/72">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
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
    <AuthLayout mode="login">
      <Card className="border-border/80 shadow-soft">
        <CardHeader className="space-y-4 p-8">
          <Badge variant="success" className="w-fit">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Protected account access
          </Badge>
          <div>
            <CardTitle className="text-4xl">Welcome back</CardTitle>
            <CardDescription className="mt-3 text-base">
              Sign in to review this month&apos;s budget performance.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                className="h-12"
                id="login-email"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                className="h-12"
                id="login-password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            <ErrorMessage>{error}</ErrorMessage>
            <Button className="h-12" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Button
                className="align-baseline"
                variant="link"
                type="button"
                onClick={() => navigate("register")}
              >
                Create an account
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
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
    <AuthLayout mode="register">
      <Card className="border-border/80 shadow-soft">
        <CardHeader className="space-y-4 p-8">
          <Badge variant="success" className="w-fit">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Start with a clean budget
          </Badge>
          <div>
            <CardTitle className="text-4xl">Create your workspace</CardTitle>
            <CardDescription className="mt-3 text-base">
              Set up your account and open the monthly dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2.5">
              <Label htmlFor="register-username">Username</Label>
              <Input
                className="h-12"
                id="register-username"
                autoComplete="username"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="mapleuser"
                required
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="register-email">Email</Label>
              <Input
                className="h-12"
                id="register-email"
                autoComplete="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="register-password">Password</Label>
              <Input
                className="h-12"
                id="register-password"
                autoComplete="new-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Choose a password"
                required
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="register-currency">Currency</Label>
              <Input
                className="h-12"
                id="register-currency"
                value={form.default_currency}
                onChange={(event) => updateField("default_currency", event.target.value)}
                required
              />
            </div>
            <ErrorMessage>{error}</ErrorMessage>
            <Button className="h-12" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                className="align-baseline"
                variant="link"
                type="button"
                onClick={() => navigate("login")}
              >
                Sign in
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function AppShell({ route, user, onLogout, children }) {
  const pageTitles = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    budgets: "Budgets",
    categories: "Categories",
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <AppSidebar activeRoute={route} />
        <section className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            activeRoute={route}
            title={pageTitles[route] || "Dashboard"}
            user={user}
            onLogout={onLogout}
          />
          <div className="mx-auto w-full max-w-[1720px] flex-1 px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function PageHeader({ badge, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {badge}
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-base text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [spending, setSpending] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setError("");
      setIsLoading(true);

      try {
        const [
          summaryData,
          spendingData,
          budgetData,
          transactionData,
          categoryData,
        ] = await Promise.all([
          getCurrentMonthSummary(),
          getSpendingByCategory(),
          getBudgetProgress(),
          getTransactions(),
          getCategories(),
        ]);

        if (isActive) {
          setSummary(summaryData);
          setSpending(spendingData);
          setBudgetProgress(budgetData);
          setTransactions(transactionData);
          setCategories(categoryData);
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

  const maxSpending = useMemo(
    () => Math.max(...spending.map((item) => Number(item.total || 0)), 0),
    [spending],
  );
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const budgetRisks = useMemo(
    () =>
      [...budgetProgress]
        .sort((first, second) => Number(second.percent_used) - Number(first.percent_used))
        .slice(0, 5),
    [budgetProgress],
  );

  return (
    <>
      <PageHeader
        badge={
          <Badge variant="outline" className="mb-3 bg-white">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            {summary ? `${summary.month}/${summary.year}` : "Current month"}
          </Badge>
        }
        title="Financial dashboard"
        description="A wider view of income, expenses, spending categories, and budget progress for the current month."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => navigate("transactions")}>
              <Plus className="mr-2 h-4 w-4" />
              Add transaction
            </Button>
            <Badge variant="success">Live summary</Badge>
            <Badge variant="warning">CAD workspace</Badge>
          </>
        }
      />

      <ErrorMessage>{error}</ErrorMessage>
      {isLoading && <DashboardSkeleton />}

      {summary && (
        <div className="mt-6 grid gap-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Income"
              value={formatMoney(summary.income_total)}
              description="Money recorded this month"
              icon={ArrowUpRight}
              tone="emerald"
            />
            <MetricCard
              title="Expenses"
              value={formatMoney(summary.expense_total)}
              description="Outflow across categories"
              icon={ArrowDownRight}
              tone="rose"
            />
            <MetricCard
              title="Net balance"
              value={formatMoney(summary.net_balance)}
              description="Income after expenses"
              icon={CircleDollarSign}
              tone="teal"
            />
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Spending by category
                  </CardTitle>
                  <CardDescription>
                    Expense distribution for the current month.
                  </CardDescription>
                </div>
                <Badge variant="outline">{spending.length} categories</Badge>
              </CardHeader>
              <CardContent>
                {spending.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No spending recorded"
                    description="Expenses will appear here after transactions are added."
                    actionLabel="Add transaction"
                    onAction={() => navigate("transactions")}
                  />
                ) : (
                  <div className="grid gap-4">
                    {spending.map((item) => (
                      <CategorySpendingRow
                        key={item.category_id ?? "uncategorized"}
                        item={item}
                        max={maxSpending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Budget progress
                  </CardTitle>
                  <CardDescription>
                    Planned budgets compared with current spending.
                  </CardDescription>
                </div>
                <Badge variant="outline">{budgetProgress.length} budgets</Badge>
              </CardHeader>
              <CardContent>
                {budgetProgress.length === 0 ? (
                  <EmptyState
                    icon={LineChart}
                    title="No budgets set"
                    description="Budget progress will appear when monthly budgets exist."
                    actionLabel="Create budget"
                    onAction={() => navigate("budgets")}
                  />
                ) : (
                  <div className="grid gap-5">
                    {budgetProgress.map((item) => (
                      <BudgetProgressRow item={item} key={item.budget_id} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Recent transactions
                  </CardTitle>
                  <CardDescription>
                    Latest entries across income and expense activity.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("transactions")}>
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No recent transactions"
                    description="Create a transaction to see the newest activity here."
                    actionLabel="Add transaction"
                    onAction={() => navigate("transactions")}
                  />
                ) : (
                  <div className="grid gap-3">
                    {recentTransactions.map((transaction) => (
                      <TransactionCompactRow
                        categories={categories}
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Top budget risks
                  </CardTitle>
                  <CardDescription>
                    Budgets closest to their monthly limit.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("budgets")}>
                  Manage
                </Button>
              </CardHeader>
              <CardContent>
                {budgetRisks.length === 0 ? (
                  <EmptyState
                    icon={WalletCards}
                    title="No budget risks yet"
                    description="Create budgets to monitor risk against monthly spending."
                    actionLabel="Create budget"
                    onAction={() => navigate("budgets")}
                  />
                ) : (
                  <div className="grid gap-4">
                    {budgetRisks.map((item) => (
                      <BudgetRiskRow item={item} key={item.budget_id} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(defaultTransactionForm());
  const [filters, setFilters] = useState(defaultTransactionFilters());
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadPage() {
    setError("");
    setIsLoading(true);

    try {
      const [transactionData, categoryData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateField(field, value) {
    setNotice("");
    setFormErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "type" ? { category_id: "" } : {}),
    }));
  }

  function resetForm() {
    setFormErrors({});
    setEditingId(null);
    setForm(defaultTransactionForm());
  }

  function startEdit(transaction) {
    setNotice("");
    setEditingId(transaction.id);
    setForm({
      amount: String(transaction.amount),
      type: transaction.type,
      note: transaction.note || "",
      date: transaction.date,
      category_id: transaction.category_id ? String(transaction.category_id) : "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const nextErrors = validateTransactionForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    const payload = {
      amount: form.amount,
      type: form.type,
      note: form.note || null,
      date: form.date,
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }
      setNotice(editingId ? "Transaction updated." : "Transaction created.");
      resetForm();
      await loadPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(transactionId) {
    const transaction = transactions.find((item) => item.id === transactionId);
    const label = transaction?.note || formatMoney(transaction?.amount);
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");
    setDeletingId(transactionId);
    try {
      await deleteTransaction(transactionId);
      setNotice("Transaction deleted.");
      await loadPage();
      if (editingId === transactionId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCategories = categories.filter(
    (category) => category.type === form.type,
  );
  const filterCategoryOptions = categories.filter(
    (category) => filters.type === "all" || category.type === filters.type,
  );
  const visibleTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (filters.type !== "all" && transaction.type !== filters.type) {
          return false;
        }
        if (
          filters.category_id !== "all" &&
          String(transaction.category_id || "") !== filters.category_id
        ) {
          return false;
        }
        if (filters.start_date && transaction.date < filters.start_date) {
          return false;
        }
        if (filters.end_date && transaction.date > filters.end_date) {
          return false;
        }
        return true;
      }),
    [filters, transactions],
  );
  const transactionTotals = useMemo(
    () =>
      visibleTransactions.reduce(
        (totals, transaction) => {
          totals[transaction.type] += Number(transaction.amount || 0);
          return totals;
        },
        { income: 0, expense: 0 },
      ),
    [visibleTransactions],
  );
  const isTransactionSubmitDisabled =
    isSubmitting ||
    !form.amount ||
    !form.date ||
    !isPositiveAmount(form.amount) ||
    !["income", "expense"].includes(form.type);

  return (
    <>
      <PageHeader
        badge={
          <Badge variant="outline" className="mb-3 bg-white">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Money movement
          </Badge>
        }
        title="Transactions"
        description="Create, review, edit, and remove income or expense entries while keeping categories attached."
        actions={
          <>
            <Badge variant="success">{formatMoney(transactionTotals.income)} income</Badge>
            <Badge variant="warning">{formatMoney(transactionTotals.expense)} expenses</Badge>
            <Badge variant="outline" className="bg-white">
              {pluralize(visibleTransactions.length, "match", "matches")}
            </Badge>
            <Button type="button" variant="outline" onClick={loadPage} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.45fr)]">
        <Card className="shadow-soft">
          <CardHeader className="p-7">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Edit transaction" : "New transaction"}
            </CardTitle>
            <CardDescription className="text-base">
              Capture the amount, date, type, and optional category.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <FormGrid>
                <FormField label="Amount" htmlFor="transaction-amount">
                  <Input
                    className="h-12"
                    id="transaction-amount"
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={form.amount}
                    onChange={(event) => updateField("amount", event.target.value)}
                    placeholder="42.50"
                    required
                  />
                  <FieldError>{formErrors.amount}</FieldError>
                </FormField>
                <FormField label="Date" htmlFor="transaction-date">
                  <Input
                    className="h-12"
                    id="transaction-date"
                    type="date"
                    value={form.date}
                    onChange={(event) => updateField("date", event.target.value)}
                    required
                  />
                  <FieldError>{formErrors.date}</FieldError>
                </FormField>
              </FormGrid>
              <FormGrid>
                <FormField label="Type" htmlFor="transaction-type">
                  <SelectField
                    id="transaction-type"
                    value={form.type}
                    onChange={(event) => updateField("type", event.target.value)}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </SelectField>
                  <FieldError>{formErrors.type}</FieldError>
                </FormField>
                <FormField label="Category" htmlFor="transaction-category">
                  <SelectField
                    id="transaction-category"
                    value={form.category_id}
                    onChange={(event) => updateField("category_id", event.target.value)}
                  >
                    <option value="">Uncategorized</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </SelectField>
                </FormField>
              </FormGrid>
              {categories.length === 0 && (
                <InlineHint
                  actionLabel="Create categories"
                  onAction={() => navigate("categories")}
                >
                  Add categories first if you want richer spending reports and budget
                  progress.
                </InlineHint>
              )}
              <FormField label="Note" htmlFor="transaction-note">
                <Input
                  className="h-12"
                  id="transaction-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Weekly groceries"
                />
              </FormField>
              <SuccessMessage>{notice}</SuccessMessage>
              <ErrorMessage>{error}</ErrorMessage>
              <div className="flex flex-wrap gap-3">
                <Button className="h-12" type="submit" disabled={isTransactionSubmitDisabled}>
                  {editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create transaction"}
                </Button>
                {editingId && (
                  <Button className="h-12" variant="outline" type="button" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="p-7">
            <CardTitle className="text-2xl">Transaction ledger</CardTitle>
            <CardDescription className="text-base">
              Filtered by type, category, and date range.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <FilterPanel
              onClear={() => setFilters(defaultTransactionFilters())}
              title="Filter transactions"
            >
              <FormGrid>
                <FormField label="Type" htmlFor="filter-transaction-type">
                  <SelectField
                    id="filter-transaction-type"
                    value={filters.type}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        type: event.target.value,
                        category_id: "all",
                      }))
                    }
                  >
                    <option value="all">All types</option>
                    <option value="expense">Expenses</option>
                    <option value="income">Income</option>
                  </SelectField>
                </FormField>
                <FormField label="Category" htmlFor="filter-transaction-category">
                  <SelectField
                    id="filter-transaction-category"
                    value={filters.category_id}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        category_id: event.target.value,
                      }))
                    }
                  >
                    <option value="all">All categories</option>
                    <option value="">Uncategorized</option>
                    {filterCategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </SelectField>
                </FormField>
              </FormGrid>
              <FormGrid>
                <FormField label="Start date" htmlFor="filter-transaction-start">
                  <Input
                    className="h-12"
                    id="filter-transaction-start"
                    type="date"
                    value={filters.start_date}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="End date" htmlFor="filter-transaction-end">
                  <Input
                    className="h-12"
                    id="filter-transaction-end"
                    type="date"
                    value={filters.end_date}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                  />
                </FormField>
              </FormGrid>
            </FilterPanel>
            {isLoading ? (
              <ListSkeleton />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No transactions yet"
                description="Create an income or expense record to start filling the ledger."
                actionLabel="Create first transaction"
                onAction={() => {
                  setNotice("");
                  document.getElementById("transaction-amount")?.focus();
                }}
              />
            ) : visibleTransactions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No matching transactions"
                description="Adjust or clear the filters to bring transactions back into view."
                actionLabel="Clear filters"
                onAction={() => setFilters(defaultTransactionFilters())}
              />
            ) : (
              <div className="grid gap-3">
                {visibleTransactions.map((transaction) => (
                  <TransactionListItem
                    categories={categories}
                    isEditing={editingId === transaction.id}
                    key={transaction.id}
                    onDelete={handleDelete}
                    onEdit={startEdit}
                    deletingId={deletingId}
                    transaction={transaction}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(defaultBudgetForm());
  const [filters, setFilters] = useState(defaultBudgetFilters());
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadPage() {
    setError("");
    setIsLoading(true);

    try {
      const [budgetData, categoryData] = await Promise.all([getBudgets(), getCategories()]);
      setBudgets(budgetData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateField(field, value) {
    setNotice("");
    setFormErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setFormErrors({});
    setEditingId(null);
    setForm(defaultBudgetForm());
  }

  function startEdit(budget) {
    setNotice("");
    setEditingId(budget.id);
    setForm({
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
      category_id: budget.category_id ? String(budget.category_id) : "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const nextErrors = validateBudgetForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    const payload = {
      amount: form.amount,
      month: Number(form.month),
      year: Number(form.year),
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      if (editingId) {
        await updateBudget(editingId, payload);
      } else {
        await createBudget(payload);
      }
      setNotice(editingId ? "Budget updated." : "Budget created.");
      resetForm();
      await loadPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(budgetId) {
    const budget = budgets.find((item) => item.id === budgetId);
    const label = budget
      ? `${categoryLabel(categories, budget.category_id, "overall budget")} for ${budget.month}/${budget.year}`
      : "this budget";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");
    setDeletingId(budgetId);
    try {
      await deleteBudget(budgetId);
      setNotice("Budget deleted.");
      await loadPage();
      if (editingId === budgetId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const expenseCategories = categories.filter((category) => category.type === "expense");
  const visibleBudgets = useMemo(
    () =>
      budgets.filter((budget) => {
        if (filters.month !== "all" && String(budget.month) !== filters.month) {
          return false;
        }
        if (filters.year && String(budget.year) !== filters.year) {
          return false;
        }
        return true;
      }),
    [budgets, filters],
  );
  const totalBudgeted = useMemo(
    () => visibleBudgets.reduce((total, budget) => total + Number(budget.amount || 0), 0),
    [visibleBudgets],
  );
  const isBudgetSubmitDisabled =
    isSubmitting ||
    !form.amount ||
    !isPositiveAmount(form.amount) ||
    !form.month ||
    !form.year ||
    Number(form.month) < 1 ||
    Number(form.month) > 12 ||
    Number(form.year) < 1900 ||
    Number(form.year) > 9999;

  return (
    <>
      <PageHeader
        badge={
          <Badge variant="outline" className="mb-3 bg-white">
            <WalletCards className="mr-1.5 h-3.5 w-3.5" />
            Monthly planning
          </Badge>
        }
        title="Budgets"
        description="Set monthly limits for overall spend or specific expense categories, then adjust them as plans change."
        actions={
          <>
            <Badge variant="success">{formatMoney(totalBudgeted)} planned</Badge>
            <Badge variant="outline" className="bg-white">
              {pluralize(budgets.length, "plan")}
            </Badge>
            <Button type="button" variant="outline" onClick={loadPage} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.45fr)]">
        <Card className="shadow-soft">
          <CardHeader className="p-7">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Edit budget" : "New budget"}
            </CardTitle>
            <CardDescription className="text-base">
              Choose a month, amount, and optional expense category.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <FormField label="Amount" htmlFor="budget-amount">
                <Input
                  className="h-12"
                  id="budget-amount"
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="500.00"
                  required
                />
                <FieldError>{formErrors.amount}</FieldError>
              </FormField>
              <FormGrid>
                <FormField label="Month" htmlFor="budget-month">
                  <SelectField
                    id="budget-month"
                    value={form.month}
                    onChange={(event) => updateField("month", event.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </SelectField>
                  <FieldError>{formErrors.month}</FieldError>
                </FormField>
                <FormField label="Year" htmlFor="budget-year">
                  <Input
                    className="h-12"
                    id="budget-year"
                    min="1900"
                    max="9999"
                    type="number"
                    value={form.year}
                    onChange={(event) => updateField("year", event.target.value)}
                    required
                  />
                  <FieldError>{formErrors.year}</FieldError>
                </FormField>
              </FormGrid>
              <FormField label="Category" htmlFor="budget-category">
                <SelectField
                  id="budget-category"
                  value={form.category_id}
                  onChange={(event) => updateField("category_id", event.target.value)}
                >
                  <option value="">Overall budget</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectField>
              </FormField>
              {expenseCategories.length === 0 && (
                <InlineHint
                  actionLabel="Create expense categories"
                  onAction={() => navigate("categories")}
                >
                  Category budgets become available after you create at least one
                  expense category.
                </InlineHint>
              )}
              <SuccessMessage>{notice}</SuccessMessage>
              <ErrorMessage>{error}</ErrorMessage>
              <div className="flex flex-wrap gap-3">
                <Button className="h-12" type="submit" disabled={isBudgetSubmitDisabled}>
                  {editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create budget"}
                </Button>
                {editingId && (
                  <Button className="h-12" variant="outline" type="button" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="p-7">
            <CardTitle className="text-2xl">Budget list</CardTitle>
            <CardDescription className="text-base">
              Monthly plans sorted from newest period to oldest.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <FilterPanel onClear={() => setFilters(defaultBudgetFilters())} title="Filter budgets">
              <FormGrid>
                <FormField label="Month" htmlFor="filter-budget-month">
                  <SelectField
                    id="filter-budget-month"
                    value={filters.month}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, month: event.target.value }))
                    }
                  >
                    <option value="all">All months</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </SelectField>
                </FormField>
                <FormField label="Year" htmlFor="filter-budget-year">
                  <Input
                    className="h-12"
                    id="filter-budget-year"
                    min="1900"
                    max="9999"
                    type="number"
                    value={filters.year}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, year: event.target.value }))
                    }
                    placeholder="2026"
                  />
                </FormField>
              </FormGrid>
            </FilterPanel>
            {isLoading ? (
              <ListSkeleton />
            ) : budgets.length === 0 ? (
              <EmptyState
                icon={WalletCards}
                title="No budgets yet"
                description="Create an overall monthly budget or attach one to an expense category."
                actionLabel="Create first budget"
                onAction={() => {
                  setNotice("");
                  document.getElementById("budget-amount")?.focus();
                }}
              />
            ) : visibleBudgets.length === 0 ? (
              <EmptyState
                icon={WalletCards}
                title="No matching budgets"
                description="Adjust the month or year filter to find other budget plans."
                actionLabel="Clear filters"
                onAction={() => setFilters(defaultBudgetFilters())}
              />
            ) : (
              <div className="grid gap-3">
                {visibleBudgets.map((budget) => (
                  <BudgetListItem
                    budget={budget}
                    categories={categories}
                    isEditing={editingId === budget.id}
                    key={budget.id}
                    onDelete={handleDelete}
                    onEdit={startEdit}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "" });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadPage() {
    setError("");
    setIsLoading(true);

    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateField(field, value) {
    setNotice("");
    setFormErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const nextErrors = validateCategoryForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    try {
      await createCategory({
        name: form.name,
        type: form.type,
        icon: form.icon || null,
      });
      setNotice("Category created.");
      setFormErrors({});
      setForm({ name: "", type: "expense", icon: "" });
      await loadPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const incomeCategories = categories.filter((category) => category.type === "income");
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const isCategorySubmitDisabled =
    isSubmitting || !form.name.trim() || !["income", "expense"].includes(form.type);

  return (
    <>
      <PageHeader
        badge={
          <Badge variant="outline" className="mb-3 bg-white">
            <Tags className="mr-1.5 h-3.5 w-3.5" />
            Category library
          </Badge>
        }
        title="Categories"
        description="Create reusable income and expense categories for cleaner transactions and budget reporting."
        actions={
          <>
            <Badge variant="success">{pluralize(categories.length, "category", "categories")}</Badge>
            <Badge variant="warning">
              {pluralize(expenseCategories.length, "expense category", "expense categories")}
            </Badge>
            <Button type="button" variant="outline" onClick={loadPage} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.45fr)]">
        <Card className="shadow-soft">
          <CardHeader className="p-7">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Plus className="h-5 w-5 text-primary" />
              New category
            </CardTitle>
            <CardDescription className="text-base">
              Categories are scoped to your account and reusable across records.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <FormField label="Name" htmlFor="category-name">
                <Input
                  className="h-12"
                  id="category-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Groceries"
                  required
                />
                <FieldError>{formErrors.name}</FieldError>
              </FormField>
              <FormGrid>
                <FormField label="Type" htmlFor="category-type">
                  <SelectField
                    id="category-type"
                    value={form.type}
                    onChange={(event) => updateField("type", event.target.value)}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </SelectField>
                  <FieldError>{formErrors.type}</FieldError>
                </FormField>
                <FormField label="Icon label" htmlFor="category-icon">
                  <Input
                    className="h-12"
                    id="category-icon"
                    value={form.icon}
                    onChange={(event) => updateField("icon", event.target.value)}
                    placeholder="cart"
                  />
                </FormField>
              </FormGrid>
              <ErrorMessage>{error}</ErrorMessage>
              <SuccessMessage>{notice}</SuccessMessage>
              <Button className="h-12" type="submit" disabled={isCategorySubmitDisabled}>
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
          <CategoryGroup
            categories={expenseCategories}
            icon={ArrowDownRight}
            isLoading={isLoading}
            title="Expense categories"
            tone="rose"
            emptyActionLabel="Create expense category"
            onEmptyAction={() => document.getElementById("category-name")?.focus()}
          />
          <CategoryGroup
            categories={incomeCategories}
            icon={ArrowUpRight}
            isLoading={isLoading}
            title="Income categories"
            tone="emerald"
            emptyActionLabel="Create income category"
            onEmptyAction={() => {
              updateField("type", "income");
              document.getElementById("category-name")?.focus();
            }}
          />
        </div>
      </div>
    </>
  );
}

function AppSidebar({ activeRoute }) {
  const navItems = [
    { label: "Dashboard", route: "dashboard", icon: LayoutDashboard },
    { label: "Transactions", route: "transactions", icon: CreditCard },
    { label: "Budgets", route: "budgets", icon: WalletCards },
    { label: "Categories", route: "categories", icon: Tags },
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-white/85 px-4 py-5 backdrop-blur lg:block">
      <div className="flex h-full flex-col">
        <BrandMark />
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.route === activeRoute;
            return (
              <button
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-muted-foreground transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border bg-accent/70 p-4">
          <p className="text-sm font-semibold text-accent-foreground">
            Monthly close
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review categories before setting next month&apos;s targets.
          </p>
        </div>
      </div>
    </aside>
  );
}

function DashboardTopbar({ activeRoute, title, user, onLogout }) {
  const mobileItems = [
    { label: "Dashboard", route: "dashboard" },
    { label: "Transactions", route: "transactions" },
    { label: "Budgets", route: "budgets" },
    { label: "Categories", route: "categories" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b bg-background/92 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1720px] flex-col gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0 xl:px-10">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">MapleBudget</p>
              <p className="truncate text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.default_currency || "CAD"}</p>
            </div>
            <Button variant="outline" type="button" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto lg:hidden">
          {mobileItems.map((item) => (
            <Button
              key={item.route}
              type="button"
              variant={item.route === activeRoute ? "default" : "outline"}
              size="sm"
              onClick={() => navigate(item.route)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function MetricCard({ title, value, description, icon: Icon, tone }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-normal xl:text-4xl">
              {value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className={cn("rounded-lg border p-3", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategorySpendingRow({ item, max }) {
  const value = Number(item.total || 0);
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.category_name || "Uncategorized"}
          </p>
          <p className="text-xs text-muted-foreground">Current month expenses</p>
        </div>
        <p className="shrink-0 text-sm font-semibold">{formatMoney(item.total)}</p>
      </div>
      <Progress
        value={percent}
        className="h-2 bg-muted"
        indicatorClassName="bg-emerald-600"
      />
    </div>
  );
}

function BudgetProgressRow({ item }) {
  const percentUsed = Number(item.percent_used || 0);
  const isOverBudget = percentUsed > 100;

  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">
            {item.category_name || "Overall budget"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMoney(item.spent_amount)} spent of {formatMoney(item.budget_amount)}
          </p>
        </div>
        <Badge variant={isOverBudget ? "warning" : "success"}>
          {item.percent_used}% used
        </Badge>
      </div>
      <Progress
        value={percentUsed}
        className="h-3"
        indicatorClassName={isOverBudget ? "bg-amber-500" : "bg-primary"}
      />
      <Separator />
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Remaining</span>
        <span className={cn("font-semibold", isOverBudget && "text-amber-700")}>
          {formatMoney(item.remaining_amount)}
        </span>
      </div>
    </div>
  );
}

function TransactionCompactRow({ transaction, categories }) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant={isIncome ? "success" : "warning"}>
            {isIncome ? "Income" : "Expense"}
          </Badge>
          <p className="truncate text-sm font-semibold">
            {transaction.note || categoryLabel(categories, transaction.category_id)}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {transaction.date} - {categoryLabel(categories, transaction.category_id)}
        </p>
      </div>
      <p className={cn("shrink-0 text-base font-semibold", isIncome ? "text-emerald-700" : "text-rose-700")}>
        {isIncome ? "+" : "-"}
        {formatMoney(transaction.amount)}
      </p>
    </div>
  );
}

function BudgetRiskRow({ item }) {
  const percentUsed = Number(item.percent_used || 0);
  const isHighRisk = percentUsed >= 85;

  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.category_name || "Overall budget"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMoney(item.remaining_amount)} remaining
          </p>
        </div>
        <Badge variant={isHighRisk ? "warning" : "success"}>{item.percent_used}%</Badge>
      </div>
      <Progress
        value={percentUsed}
        className="h-3"
        indicatorClassName={isHighRisk ? "bg-amber-500" : "bg-primary"}
      />
      <p className="text-xs text-muted-foreground">
        {formatMoney(item.spent_amount)} of {formatMoney(item.budget_amount)} used
      </p>
    </div>
  );
}

function TransactionListItem({
  transaction,
  categories,
  deletingId,
  isEditing,
  onEdit,
  onDelete,
}) {
  const isIncome = transaction.type === "income";

  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg border bg-white p-4 transition-colors lg:grid-cols-[1fr_auto]",
        isEditing && "border-primary bg-emerald-50/40",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={isIncome ? "success" : "warning"}>
              {isIncome ? "Income" : "Expense"}
            </Badge>
            <p className="truncate text-base font-semibold">
              {transaction.note || "No note"}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryLabel(categories, transaction.category_id)}
          </p>
        </div>
        <p className={cn("text-lg font-semibold", isIncome ? "text-emerald-700" : "text-rose-700")}>
          {isIncome ? "+" : "-"}
          {formatMoney(transaction.amount)}
        </p>
        <p className="text-sm text-muted-foreground">{transaction.date}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => onEdit(transaction)}
          disabled={deletingId === transaction.id}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => onDelete(transaction.id)}
          disabled={deletingId === transaction.id}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deletingId === transaction.id ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function BudgetListItem({
  budget,
  categories,
  deletingId,
  isEditing,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg border bg-white p-4 transition-colors lg:grid-cols-[1fr_auto]",
        isEditing && "border-primary bg-emerald-50/40",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] sm:items-center">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">
            {categoryLabel(categories, budget.category_id, "Overall budget")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Budget target</p>
        </div>
        <p className="text-lg font-semibold">{formatMoney(budget.amount)}</p>
        <p className="text-sm text-muted-foreground">
          {budget.month}/{budget.year}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => onEdit(budget)}
          disabled={deletingId === budget.id}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => onDelete(budget.id)}
          disabled={deletingId === budget.id}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deletingId === budget.id ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function CategoryGroup({
  categories,
  emptyActionLabel,
  icon: Icon,
  isLoading,
  onEmptyAction,
  title,
  tone,
}) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="p-7">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className={cn("rounded-lg border p-2", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription className="text-base">
          {categories.length} saved {categories.length === 1 ? "category" : "categories"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-7 pb-7">
        {isLoading ? (
          <ListSkeleton />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Nothing here yet"
            description="Create a category and it will appear in this group."
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ) : (
          <div className="grid gap-3">
            {categories.map((category) => (
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4" key={category.id}>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{category.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.icon || "No icon label"}
                  </p>
                </div>
                <Badge variant="outline">{category.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <div className="grid gap-2.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function FormGrid({ children }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function FilterPanel({ children, onClear, title }) {
  return (
    <div className="mb-5 grid gap-4 rounded-lg border bg-muted/25 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ actionLabel, icon: Icon, onAction, title, description }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card className="h-40 animate-pulse bg-muted/45" key={item} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card className="h-96 animate-pulse bg-muted/45" />
        <Card className="h-96 animate-pulse bg-muted/45" />
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((item) => (
        <div className="h-24 animate-pulse rounded-lg bg-muted/55" key={item} />
      ))}
    </div>
  );
}

function defaultTransactionForm() {
  return {
    amount: "",
    type: "expense",
    note: "",
    date: todayIso(),
    category_id: "",
  };
}

function defaultBudgetForm() {
  return {
    amount: "",
    ...currentMonthForm(),
    category_id: "",
  };
}

function validateTransactionForm(form) {
  const errors = {};

  if (!form.amount) {
    errors.amount = "Amount is required.";
  } else if (!isPositiveAmount(form.amount)) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!form.date) {
    errors.date = "Date is required.";
  }

  if (!["income", "expense"].includes(form.type)) {
    errors.type = "Choose income or expense.";
  }

  return errors;
}

function validateBudgetForm(form) {
  const errors = {};
  const month = Number(form.month);
  const year = Number(form.year);

  if (!form.amount) {
    errors.amount = "Amount is required.";
  } else if (!isPositiveAmount(form.amount)) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!month || month < 1 || month > 12) {
    errors.month = "Choose a month from 1 to 12.";
  }

  if (!year || year < 1900 || year > 9999) {
    errors.year = "Enter a valid year.";
  }

  return errors;
}

function validateCategoryForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Category name is required.";
  }

  if (!["income", "expense"].includes(form.type)) {
    errors.type = "Choose income or expense.";
  }

  return errors;
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
        if (APP_ROUTES.includes(route)) {
          navigate("login");
        }
        return;
      }

      try {
        await loadUser();
        if (route === "login") {
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
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-soft">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
          <span className="text-sm font-medium">Loading MapleBudget...</span>
        </div>
      </main>
    );
  }

  if (APP_ROUTES.includes(route)) {
    if (!isAuthenticated) {
      navigate("login");
      return null;
    }

    const pages = {
      dashboard: <DashboardPage />,
      transactions: <TransactionsPage />,
      budgets: <BudgetsPage />,
      categories: <CategoriesPage />,
    };

    return (
      <AppShell route={route} user={user} onLogout={handleLogout}>
        {pages[route]}
      </AppShell>
    );
  }

  if (route === "register") {
    return <RegisterPage onRegister={loadUser} />;
  }

  return <LoginPage onLogin={loadUser} />;
}
