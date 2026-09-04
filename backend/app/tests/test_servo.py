"""Tests for servo manual-override commands and device ownership checks."""

from fastapi.testclient import TestClient


def test_admin_can_issue_command(client: TestClient, device: dict, admin_headers: dict):
    response = client.post(
        f"/servo/{device['id']}/commands",
        json={"target_x_angle": 45, "target_y_angle": 90},
        headers=admin_headers,
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending"


def test_regular_user_cannot_issue_command(
    client: TestClient, device: dict, user_headers: dict
):
    response = client.post(
        f"/servo/{device['id']}/commands",
        json={"target_x_angle": 45, "target_y_angle": 90},
        headers=user_headers,
    )
    assert response.status_code == 403


def test_device_can_poll_and_complete_own_command(
    client: TestClient, device: dict, admin_headers: dict
):
    command = client.post(
        f"/servo/{device['id']}/commands",
        json={"target_x_angle": 45, "target_y_angle": 90},
        headers=admin_headers,
    ).json()

    device_headers = {"X-Device-API-Key": device["api_key"]}
    pending = client.get("/servo/commands/pending", headers=device_headers)
    assert pending.status_code == 200
    assert len(pending.json()) == 1

    done = client.patch(
        f"/servo/commands/{command['id']}",
        json={"status": "done"},
        headers=device_headers,
    )
    assert done.status_code == 200
    assert done.json()["status"] == "done"


def test_device_cannot_update_other_devices_command(
    client: TestClient, device: dict, admin_headers: dict
):
    command = client.post(
        f"/servo/{device['id']}/commands",
        json={"target_x_angle": 45, "target_y_angle": 90},
        headers=admin_headers,
    ).json()

    other_device = client.post(
        "/devices", json={"name": "other-device"}, headers=admin_headers
    ).json()
    other_headers = {"X-Device-API-Key": other_device["api_key"]}

    response = client.patch(
        f"/servo/commands/{command['id']}",
        json={"status": "done"},
        headers=other_headers,
    )
    assert response.status_code == 403
