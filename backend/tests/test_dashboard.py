from datetime import date


def register_and_login(client, username, email):
    register_response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "StrongPassword123",
            "default_currency": "CAD",
        },
    )
    assert register_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": "StrongPassword123",
        },
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_category(client, token, name="Groceries", category_type="expense"):
    response = client.post(
        "/categories",
        json={
            "name": name,
            "type": category_type,
            "icon": "cart",
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    return response.json()


def create_transaction(
    client,
    token,
    amount,
    transaction_type,
    category_id=None,
):
    today = date.today()
    response = client.post(
        "/transactions",
        json={
            "amount": amount,
            "type": transaction_type,
            "note": "Dashboard test",
            "date": today.isoformat(),
            "category_id": category_id,
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    return response.json()


def create_budget(client, token, amount, category_id=None):
    today = date.today()
    response = client.post(
        "/budgets",
        json={
            "amount": amount,
            "month": today.month,
            "year": today.year,
            "category_id": category_id,
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    return response.json()


def test_current_month_summary_totals(client):
    token = register_and_login(client, "dashboarduser", "dashboard@example.com")
    create_transaction(client, token, "2500.00", "income")
    create_transaction(client, token, "125.50", "expense")
    create_transaction(client, token, "74.50", "expense")
    today = date.today()

    summary_response = client.get(
        "/dashboard/current-month-summary",
        headers=auth_headers(token),
    )
    income_response = client.get(
        "/dashboard/current-month-income",
        headers=auth_headers(token),
    )
    expense_response = client.get(
        "/dashboard/current-month-expenses",
        headers=auth_headers(token),
    )
    net_response = client.get(
        "/dashboard/current-month-net-balance",
        headers=auth_headers(token),
    )

    assert summary_response.status_code == 200
    assert summary_response.json() == {
        "month": today.month,
        "year": today.year,
        "income_total": "2500.00",
        "expense_total": "200.00",
        "net_balance": "2300.00",
    }
    assert income_response.json() == {"amount": "2500.00"}
    assert expense_response.json() == {"amount": "200.00"}
    assert net_response.json() == {"amount": "2300.00"}


def test_spending_grouped_by_category(client):
    token = register_and_login(client, "spendinguser", "spending@example.com")
    groceries = create_category(client, token, name="Groceries")
    rent = create_category(client, token, name="Rent")
    create_transaction(client, token, "50.00", "expense", groceries["id"])
    create_transaction(client, token, "25.25", "expense", groceries["id"])
    create_transaction(client, token, "1000.00", "expense", rent["id"])
    create_transaction(client, token, "2500.00", "income")

    response = client.get(
        "/dashboard/current-month-spending-by-category",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "category_id": groceries["id"],
            "category_name": "Groceries",
            "total": "75.25",
        },
        {
            "category_id": rent["id"],
            "category_name": "Rent",
            "total": "1000.00",
        },
    ]


def test_budget_progress_includes_global_and_category_budgets(client):
    token = register_and_login(client, "progressuser", "progress@example.com")
    groceries = create_category(client, token, name="Groceries")
    global_budget = create_budget(client, token, "1000.00")
    grocery_budget = create_budget(client, token, "200.00", groceries["id"])
    create_transaction(client, token, "75.00", "expense", groceries["id"])
    create_transaction(client, token, "25.00", "expense")
    today = date.today()

    response = client.get(
        "/dashboard/current-month-budget-progress",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "budget_id": global_budget["id"],
            "category_id": None,
            "category_name": None,
            "month": today.month,
            "year": today.year,
            "budget_amount": "1000.00",
            "spent_amount": "100.00",
            "remaining_amount": "900.00",
            "percent_used": "10.00",
        },
        {
            "budget_id": grocery_budget["id"],
            "category_id": groceries["id"],
            "category_name": "Groceries",
            "month": today.month,
            "year": today.year,
            "budget_amount": "200.00",
            "spent_amount": "75.00",
            "remaining_amount": "125.00",
            "percent_used": "37.50",
        },
    ]


def test_dashboard_endpoints_require_auth(client):
    endpoints = [
        "/dashboard/current-month-summary",
        "/dashboard/current-month-income",
        "/dashboard/current-month-expenses",
        "/dashboard/current-month-net-balance",
        "/dashboard/current-month-spending-by-category",
        "/dashboard/current-month-budget-progress",
    ]

    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 401
        assert response.json() == {"detail": "Not authenticated"}
