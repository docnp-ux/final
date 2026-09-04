"""Tests for device registration, ownership, and listing."""

from fastapi.testclient import TestClient


def test_regular_user_can_register_own_device(client: TestClient, user_headers: dict):
    response = client.post("/devices", json={"name": "d1"}, headers=user_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "d1"
    assert "api_key" in body
    assert body["owner_username"] == "regularuser"


def test_register_device_as_admin_returns_api_key(
    client: TestClient, admin_headers: dict
):
    response = client.post("/devices", json={"name": "d1"}, headers=admin_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "d1"
    assert "api_key" in body
    assert body["owner_username"] == "admin"


def test_admin_can_assign_device_to_another_user(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    me = client.get("/users/me", headers=user_headers).json()
    response = client.post(
        "/devices",
        json={"name": "d1", "owner_id": me["id"]},
        headers=admin_headers,
    )
    assert response.status_code == 201
    assert response.json()["owner_username"] == "regularuser"


def test_regular_user_cannot_assign_owner(client: TestClient, admin_headers: dict, user_headers: dict):
    me = client.get("/users/me", headers=admin_headers).json()
    response = client.post(
        "/devices",
        json={"name": "d1", "owner_id": me["id"]},
        headers=user_headers,
    )
    assert response.status_code == 201
    # owner_id is silently ignored for non-admins — always owned by the requester.
    assert response.json()["owner_username"] == "regularuser"


def test_duplicate_device_name_fails(client: TestClient, admin_headers: dict):
    client.post("/devices", json={"name": "d1"}, headers=admin_headers)
    response = client.post("/devices", json={"name": "d1"}, headers=admin_headers)
    assert response.status_code == 422


def test_get_unknown_device_404s(client: TestClient, admin_headers: dict):
    response = client.get("/devices/999", headers=admin_headers)
    assert response.status_code == 404


def test_list_devices_requires_auth(client: TestClient):
    response = client.get("/devices")
    assert response.status_code == 401


def test_regular_user_only_sees_own_devices(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    client.post("/devices", json={"name": "admin-device"}, headers=admin_headers)
    client.post("/devices", json={"name": "my-device"}, headers=user_headers)

    response = client.get("/devices", headers=user_headers)
    assert response.status_code == 200
    names = [d["name"] for d in response.json()]
    assert names == ["my-device"]


def test_admin_sees_all_devices_with_owner(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    client.post("/devices", json={"name": "admin-device"}, headers=admin_headers)
    client.post("/devices", json={"name": "my-device"}, headers=user_headers)

    response = client.get("/devices", headers=admin_headers)
    assert response.status_code == 200
    owners = {d["name"]: d["owner_username"] for d in response.json()}
    assert owners == {"admin-device": "admin", "my-device": "regularuser"}


def test_regular_user_cannot_fetch_others_device(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    created = client.post(
        "/devices", json={"name": "admin-device"}, headers=admin_headers
    ).json()

    response = client.get(f"/devices/{created['id']}", headers=user_headers)
    assert response.status_code == 404


def test_admin_can_delete_device(client: TestClient, admin_headers: dict):
    created = client.post(
        "/devices", json={"name": "to-delete"}, headers=admin_headers
    ).json()

    response = client.delete(f"/devices/{created['id']}", headers=admin_headers)
    assert response.status_code == 204

    response = client.get(f"/devices/{created['id']}", headers=admin_headers)
    assert response.status_code == 404


def test_delete_device_also_removes_its_readings(
    client: TestClient, admin_headers: dict
):
    created = client.post(
        "/devices", json={"name": "to-delete"}, headers=admin_headers
    ).json()
    device_headers = {"X-Device-API-Key": created["api_key"]}
    client.post(
        "/measurements/sensor",
        json={
            "ldr_top_left": 1,
            "ldr_top_right": 1,
            "ldr_bottom_left": 1,
            "ldr_bottom_right": 1,
            "x_angle": 90,
            "y_angle": 90,
        },
        headers=device_headers,
    )

    response = client.delete(f"/devices/{created['id']}", headers=admin_headers)
    assert response.status_code == 204

    response = client.get(
        f"/measurements/sensor/{created['id']}", headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json() == []


def test_regular_user_cannot_delete_device(
    client: TestClient, admin_headers: dict, user_headers: dict
):
    created = client.post(
        "/devices", json={"name": "d1"}, headers=admin_headers
    ).json()

    response = client.delete(f"/devices/{created['id']}", headers=user_headers)
    assert response.status_code == 403


def test_delete_unknown_device_404s(client: TestClient, admin_headers: dict):
    response = client.delete("/devices/999", headers=admin_headers)
    assert response.status_code == 404
