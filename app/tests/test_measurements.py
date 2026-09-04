"""Tests for sensor/power ingestion and role-based retrieval."""

from fastapi.testclient import TestClient


def device_headers(device: dict) -> dict:
    return {"X-Device-API-Key": device["api_key"]}


def test_device_auth_requires_valid_api_key(client: TestClient):
    response = client.post(
        "/measurements/sensor",
        json={
            "ldr_top_left": 1,
            "ldr_top_right": 1,
            "ldr_bottom_left": 1,
            "ldr_bottom_right": 1,
            "x_angle": 90,
            "y_angle": 90,
        },
        headers={"X-Device-API-Key": "not-a-real-key"},
    )
    assert response.status_code == 401


def test_sensor_reading_computes_averages(client: TestClient, device: dict):
    response = client.post(
        "/measurements/sensor",
        json={
            "ldr_top_left": 600,
            "ldr_top_right": 650,
            "ldr_bottom_left": 400,
            "ldr_bottom_right": 420,
            "x_angle": 90,
            "y_angle": 90,
        },
        headers=device_headers(device),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["avg_top"] == 625
    assert body["avg_bottom"] == 410
    assert body["vertical_diff"] == 215


def test_regular_user_cannot_see_raw_sensor_data(
    client: TestClient, device: dict, user_headers: dict
):
    response = client.get(f"/measurements/sensor/{device['id']}", headers=user_headers)
    assert response.status_code == 403


def test_admin_can_see_raw_sensor_data(
    client: TestClient, device: dict, admin_headers: dict
):
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
        headers=device_headers(device),
    )
    response = client.get(f"/measurements/sensor/{device['id']}", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_regular_user_sees_only_panel_power(
    client: TestClient, device: dict, user_headers: dict
):
    client.post(
        "/measurements/power",
        json={"source": "panel", "voltage": 18.0, "current": 1.0, "power": 18.0},
        headers=device_headers(device),
    )
    client.post(
        "/measurements/power",
        json={"source": "load", "voltage": 5.0, "current": 0.5, "power": 2.5},
        headers=device_headers(device),
    )

    response = client.get(f"/measurements/power/{device['id']}", headers=user_headers)
    assert response.status_code == 200
    readings = response.json()
    assert len(readings) == 1
    assert "source" not in readings[0]  # simplified schema
    assert readings[0]["voltage"] == 18.0


def test_admin_sees_both_power_sources(
    client: TestClient, device: dict, admin_headers: dict
):
    client.post(
        "/measurements/power",
        json={"source": "panel", "voltage": 18.0, "current": 1.0, "power": 18.0},
        headers=device_headers(device),
    )
    client.post(
        "/measurements/power",
        json={"source": "load", "voltage": 5.0, "current": 0.5, "power": 2.5},
        headers=device_headers(device),
    )

    response = client.get(f"/measurements/power/{device['id']}", headers=admin_headers)
    assert response.status_code == 200
    readings = response.json()
    assert len(readings) == 2
    sources = {r["source"] for r in readings}
    assert sources == {"panel", "load"}
