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


def create_budget(
    client,
    token,
    amount="500.00",
    month=4,
    year=2026,
    category_id=None,
):
    return client.post(
        "/budgets",
        json={
            "amount": amount,
            "month": month,
            "year": year,
            "category_id": category_id,
        },
        headers=auth_headers(token),
    )


def test_create_budget_with_category(client):
    token = register_and_login(client, "budgetuser", "budget@example.com")
    category = create_category(client, token)

    response = create_budget(client, token, category_id=category["id"])

    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["amount"] == "500.00"
    assert body["month"] == 4
    assert body["year"] == 2026
    assert body["category_id"] == category["id"]
    assert body["created_at"]


def test_create_budget_without_category(client):
    token = register_and_login(client, "globalbudget", "globalbudget@example.com")

    response = create_budget(client, token)

    assert response.status_code == 200
    body = response.json()
    assert body["category_id"] is None
    assert body["amount"] == "500.00"


def test_list_budgets_returns_current_users_budgets(client):
    token = register_and_login(client, "listbudget", "listbudget@example.com")
    create_response = create_budget(client, token)
    assert create_response.status_code == 200

    response = client.get("/budgets", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == [create_response.json()]


def test_get_budget(client):
    token = register_and_login(client, "getbudget", "getbudget@example.com")
    create_response = create_budget(client, token)
    budget_id = create_response.json()["id"]

    response = client.get(
        f"/budgets/{budget_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json() == create_response.json()


def test_update_budget(client):
    token = register_and_login(client, "updatebudget", "updatebudget@example.com")
    category = create_category(client, token, name="Rent")
    create_response = create_budget(client, token)
    budget_id = create_response.json()["id"]

    response = client.patch(
        f"/budgets/{budget_id}",
        json={
            "amount": "1200.00",
            "month": 5,
            "year": 2026,
            "category_id": category["id"],
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == budget_id
    assert body["amount"] == "1200.00"
    assert body["month"] == 5
    assert body["year"] == 2026
    assert body["category_id"] == category["id"]


def test_delete_budget(client):
    token = register_and_login(client, "deletebudget", "deletebudget@example.com")
    create_response = create_budget(client, token)
    budget_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/budgets/{budget_id}",
        headers=auth_headers(token),
    )
    get_response = client.get(
        f"/budgets/{budget_id}",
        headers=auth_headers(token),
    )

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_create_duplicate_global_budget_fails(client):
    token = register_and_login(client, "dupglobal", "dupglobal@example.com")
    first_response = create_budget(client, token)
    assert first_response.status_code == 200

    duplicate_response = create_budget(client, token)

    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == {"detail": "Budget already exists"}


def test_create_duplicate_category_budget_fails(client):
    token = register_and_login(client, "dupcategory", "dupcategory@example.com")
    category = create_category(client, token)
    first_response = create_budget(client, token, category_id=category["id"])
    assert first_response.status_code == 200

    duplicate_response = create_budget(client, token, category_id=category["id"])

    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == {"detail": "Budget already exists"}


def test_create_budget_rejects_other_users_category(client):
    owner_token = register_and_login(client, "budgetowner", "budgetowner@example.com")
    other_token = register_and_login(client, "budgetother", "budgetother@example.com")
    other_category = create_category(client, other_token)

    response = create_budget(
        client,
        owner_token,
        category_id=other_category["id"],
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid category"}


def test_user_cannot_get_other_users_budget(client):
    owner_token = register_and_login(client, "bowner", "bowner@example.com")
    other_token = register_and_login(client, "bother", "bother@example.com")
    create_response = create_budget(client, other_token)
    budget_id = create_response.json()["id"]

    response = client.get(
        f"/budgets/{budget_id}",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Budget not found"}


def test_update_budget_rejects_duplicate_combination(client):
    token = register_and_login(client, "patchdup", "patchdup@example.com")
    first_response = create_budget(client, token, month=4, year=2026)
    second_response = create_budget(client, token, month=5, year=2026)
    assert first_response.status_code == 200
    assert second_response.status_code == 200

    response = client.patch(
        f"/budgets/{second_response.json()['id']}",
        json={
            "month": 4,
            "year": 2026,
            "category_id": None,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Budget already exists"}


def test_create_budget_rejects_invalid_month(client):
    token = register_and_login(client, "badmonth", "badmonth@example.com")

    response = create_budget(client, token, month=13)

    assert response.status_code == 422


def test_create_budget_requires_token(client):
    response = client.post(
        "/budgets",
        json={
            "amount": "500.00",
            "month": 4,
            "year": 2026,
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
