"""Tests for registration, login, and the /users/me endpoint."""

from fastapi.testclient import TestClient


def test_register_creates_user(client: TestClient):
    response = client.post(
        "/users/register", json={"username": "alice", "password": "password123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "alice"
    assert body["is_admin"] is False


def test_register_admin_username_is_admin(client: TestClient):
    response = client.post(
        "/users/register", json={"username": "admin", "password": "password123"}
    )
    assert response.status_code == 201
    assert response.json()["is_admin"] is True


def test_register_duplicate_username_fails(client: TestClient):
    client.post("/users/register", json={"username": "alice", "password": "password123"})
    response = client.post(
        "/users/register", json={"username": "alice", "password": "password123"}
    )
    assert response.status_code == 422


def test_login_success(client: TestClient):
    client.post("/users/register", json={"username": "alice", "password": "password123"})
    response = client.post(
        "/auth/login", data={"username": "alice", "password": "password123"}
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_login_wrong_password_fails(client: TestClient):
    client.post("/users/register", json={"username": "alice", "password": "password123"})
    response = client.post(
        "/auth/login", data={"username": "alice", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_me_requires_auth(client: TestClient):
    response = client.get("/users/me")
    assert response.status_code == 401


def test_me_returns_current_user(client: TestClient, user_headers: dict):
    response = client.get("/users/me", headers=user_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "regularuser"
