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
    amount="42.50",
    transaction_type="expense",
    note="Weekly groceries",
    date="2026-04-16",
    category_id=None,
):
    payload = {
        "amount": amount,
        "type": transaction_type,
        "note": note,
        "date": date,
        "category_id": category_id,
    }
    return client.post(
        "/transactions",
        json=payload,
        headers=auth_headers(token),
    )


def test_create_transaction_with_category(client):
    token = register_and_login(client, "transactionuser", "transaction@example.com")
    category = create_category(client, token)

    response = create_transaction(client, token, category_id=category["id"])

    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["amount"] == "42.50"
    assert body["type"] == "expense"
    assert body["note"] == "Weekly groceries"
    assert body["date"] == "2026-04-16"
    assert body["category_id"] == category["id"]
    assert body["created_at"]


def test_create_transaction_without_category(client):
    token = register_and_login(client, "nocategoryuser", "nocategory@example.com")

    response = create_transaction(client, token, category_id=None)

    assert response.status_code == 200
    body = response.json()
    assert body["category_id"] is None
    assert body["amount"] == "42.50"


def test_list_transactions_returns_current_users_transactions(client):
    token = register_and_login(client, "listuser", "list@example.com")
    create_response = create_transaction(client, token)
    assert create_response.status_code == 200

    response = client.get("/transactions", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == [create_response.json()]


def test_get_transaction(client):
    token = register_and_login(client, "getuser", "get@example.com")
    create_response = create_transaction(client, token)
    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/transactions/{transaction_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json() == create_response.json()


def test_update_transaction(client):
    token = register_and_login(client, "updateuser", "update@example.com")
    create_response = create_transaction(client, token)
    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/transactions/{transaction_id}",
        json={
            "amount": "75.25",
            "type": "income",
            "note": "Refund",
            "date": "2026-04-17",
            "category_id": None,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == transaction_id
    assert body["amount"] == "75.25"
    assert body["type"] == "income"
    assert body["note"] == "Refund"
    assert body["date"] == "2026-04-17"
    assert body["category_id"] is None


def test_delete_transaction(client):
    token = register_and_login(client, "deleteuser", "delete@example.com")
    create_response = create_transaction(client, token)
    transaction_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/transactions/{transaction_id}",
        headers=auth_headers(token),
    )
    get_response = client.get(
        f"/transactions/{transaction_id}",
        headers=auth_headers(token),
    )

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_create_transaction_rejects_other_users_category(client):
    owner_token = register_and_login(client, "owner", "owner@example.com")
    other_token = register_and_login(client, "other", "other@example.com")
    other_category = create_category(client, other_token)

    response = create_transaction(
        client,
        owner_token,
        category_id=other_category["id"],
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid category"}


def test_user_cannot_get_other_users_transaction(client):
    owner_token = register_and_login(client, "txowner", "txowner@example.com")
    other_token = register_and_login(client, "txother", "txother@example.com")
    create_response = create_transaction(client, other_token)
    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/transactions/{transaction_id}",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Transaction not found"}


def test_update_transaction_rejects_other_users_category(client):
    owner_token = register_and_login(client, "patchowner", "patchowner@example.com")
    other_token = register_and_login(client, "patchother", "patchother@example.com")
    other_category = create_category(client, other_token)
    create_response = create_transaction(client, owner_token)
    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/transactions/{transaction_id}",
        json={"category_id": other_category["id"]},
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid category"}


def test_create_transaction_rejects_invalid_type(client):
    token = register_and_login(client, "invalidtype", "invalidtype@example.com")

    response = create_transaction(client, token, transaction_type="transfer")

    assert response.status_code == 422


def test_create_transaction_requires_token(client):
    response = client.post(
        "/transactions",
        json={
            "amount": "42.50",
            "type": "expense",
            "note": "Weekly groceries",
            "date": "2026-04-16",
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
