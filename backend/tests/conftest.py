"""
Shared pytest fixtures — a fresh in-memory SQLite DB per test, with the
app's session dependency overridden to use it, plus small helpers for
getting authenticated admin/user/device credentials.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from backend.app.db import get_session
from backend.app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def register_and_login(
    client: TestClient, username: str, password: str = "password123"
) -> dict:
    """Register a user and return an Authorization header for them."""
    client.post("/users/register", json={"username": username, "password": password})
    response = client.post(
        "/auth/login", data={"username": username, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="admin_headers")
def admin_headers_fixture(client: TestClient) -> dict:
    # Username "admin" auto-grants is_admin.
    return register_and_login(client, "admin")


@pytest.fixture(name="user_headers")
def user_headers_fixture(client: TestClient) -> dict:
    return register_and_login(client, "regularuser")


@pytest.fixture(name="device")
def device_fixture(client: TestClient, admin_headers: dict) -> dict:
    response = client.post(
        "/devices", json={"name": "test-device"}, headers=admin_headers
    )
    return response.json()
