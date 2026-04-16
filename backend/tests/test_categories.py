def register_and_login(client):
    client.post(
        "/auth/register",
        json={
            "username": "categoryuser",
            "email": "category@example.com",
            "password": "StrongPassword123",
            "default_currency": "CAD",
        },
    )
    response = client.post(
        "/auth/login",
        data={
            "username": "category@example.com",
            "password": "StrongPassword123",
        },
    )
    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_categories_starts_empty(client):
    token = register_and_login(client)

    response = client.get("/categories", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == []


def test_create_category(client):
    token = register_and_login(client)

    response = client.post(
        "/categories",
        json={
            "name": "Groceries",
            "type": "expense",
            "icon": "cart",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["name"] == "Groceries"
    assert body["type"] == "expense"
    assert body["icon"] == "cart"
    assert body["is_default"] is False


def test_list_categories_returns_current_users_categories(client):
    token = register_and_login(client)
    create_response = client.post(
        "/categories",
        json={
            "name": "Paycheck",
            "type": "income",
            "icon": "money",
        },
        headers=auth_headers(token),
    )
    assert create_response.status_code == 200

    response = client.get("/categories", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": create_response.json()["id"],
            "name": "Paycheck",
            "type": "income",
            "icon": "money",
            "is_default": False,
        }
    ]


def test_create_duplicate_category_for_user_fails(client):
    token = register_and_login(client)
    payload = {
        "name": "Groceries",
        "type": "expense",
        "icon": "cart",
    }
    first_response = client.post(
        "/categories",
        json=payload,
        headers=auth_headers(token),
    )
    assert first_response.status_code == 200

    duplicate_response = client.post(
        "/categories",
        json=payload,
        headers=auth_headers(token),
    )

    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == {"detail": "Category already exists"}


def test_list_categories_requires_token(client):
    response = client.get("/categories")

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
