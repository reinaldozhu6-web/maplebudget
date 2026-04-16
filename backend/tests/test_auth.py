def register_user(
    client,
    username="testuser",
    email="test@example.com",
    password="StrongPassword123",
    default_currency="CAD",
):
    return client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "default_currency": default_currency,
        },
    )


def login_user(client, email="test@example.com", password="StrongPassword123"):
    return client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )


def test_register_success(client):
    response = register_user(client)

    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["username"] == "testuser"
    assert body["email"] == "test@example.com"
    assert body["default_currency"] == "CAD"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_user(client):
    first_response = register_user(client)
    assert first_response.status_code == 200

    duplicate_response = register_user(client)

    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == {
        "detail": "Username or email already exists",
    }


def test_login_success(client):
    register_user(client)

    response = login_user(client)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client):
    register_user(client)

    response = login_user(client, password="WrongPassword123")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_auth_me_with_token(client):
    register_user(client)
    login_response = login_user(client)
    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "testuser"
    assert body["email"] == "test@example.com"
    assert body["default_currency"] == "CAD"
    assert "password" not in body
    assert "password_hash" not in body


def test_auth_me_without_token(client):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
