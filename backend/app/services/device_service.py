"""
Device Service — registration and heartbeat business logic.
"""

import secrets
from datetime import datetime, timezone

from backend.app.exceptions import BusinessError
from backend.app.models.device import Device
from backend.app.models.user import User
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from backend.app.repositories.power_reading_repository import PowerReadingRepository
from backend.app.repositories.sensor_reading_repository import SensorReadingRepository
from backend.app.repositories.servo_command_repository import ServoCommandRepository
from backend.app.repositories.servo_position_repository import ServoPositionRepository


def register_device(repo: DeviceRepository, name: str, owner_id: int) -> Device:
    """Register a new device with a freshly generated API key, owned by owner_id."""
    if repo.get_by_name(name) is not None:
        raise BusinessError("device_name_taken", "Device name already taken")

    device = Device(name=name, api_key=secrets.token_hex(32), owner_id=owner_id)
    return repo.create(device)


def get_device(repo: DeviceRepository, user: User, device_id: int) -> Device | None:
    """Admins can fetch any device; regular users only their own."""
    device = repo.get_by_id(device_id)
    if device is None:
        return None
    if not user.is_admin and device.owner_id != user.id:
        return None
    return device


def list_devices(repo: DeviceRepository, user: User, skip: int, limit: int) -> list[Device]:
    """Admins see every device; regular users see only the ones they registered."""
    owner_id = None if user.is_admin else user.id
    return repo.list(owner_id=owner_id, skip=skip, limit=limit)


def record_heartbeat(repo: DeviceRepository, device: Device) -> Device:
    """Mark a device as having just been heard from."""
    return repo.touch_last_seen(device, datetime.now(timezone.utc))


def delete_device(
    repo: DeviceRepository,
    sensor_repo: SensorReadingRepository,
    power_repo: PowerReadingRepository,
    energy_repo: EnergyAggregateRepository,
    command_repo: ServoCommandRepository,
    position_repo: ServoPositionRepository,
    device_id: int,
) -> bool:
    """Delete a device and all its readings/commands/positions. Admin only — enforce at the router."""
    device = repo.get_by_id(device_id)
    if device is None:
        return False

    sensor_repo.delete_for_device(device_id)
    power_repo.delete_for_device(device_id)
    energy_repo.delete_for_device(device_id)
    command_repo.delete_for_device(device_id)
    position_repo.delete_for_device(device_id)
    repo.delete(device)
    return True
