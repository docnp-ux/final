"""
Devices Router — Registration and listing.

POST   /devices        — register a new device, owned by the current user
                          (admins may instead assign it to any existing user)
GET    /devices         — list devices (admins see all, others see only their own)
GET    /devices/{id}    — get one device (admins any, others only their own)
DELETE /devices/{id}    — delete a device and its data. Admin only.
"""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import AdminUser, CurrentUser, Page, SessionDep
from app.repositories.device_repository import DeviceRepository
from app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from app.repositories.power_reading_repository import PowerReadingRepository
from app.repositories.sensor_reading_repository import SensorReadingRepository
from app.repositories.servo_command_repository import ServoCommandRepository
from app.repositories.servo_position_repository import ServoPositionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.device import DeviceCreate, DeviceCreatedOut, DeviceOut
from app.services import device_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceCreatedOut, status_code=status.HTTP_201_CREATED)
def register_device(data: DeviceCreate, session: SessionDep, user: CurrentUser):
    """Register a new device and get its API key."""
    owner_id, owner_username = user.id, user.username
    if user.is_admin and data.owner_id is not None:
        owner = UserRepository(session).get_by_id(data.owner_id)
        if owner is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Owner user not found")
        owner_id, owner_username = owner.id, owner.username

    device = device_service.register_device(DeviceRepository(session), data.name, owner_id)
    return DeviceCreatedOut(
        id=device.id,
        name=device.name,
        is_active=device.is_active,
        last_seen_at=device.last_seen_at,
        created_at=device.created_at,
        owner_id=device.owner_id,
        owner_username=owner_username,
        api_key=device.api_key,
    )


@router.get("", response_model=list[DeviceOut])
def list_devices(session: SessionDep, user: CurrentUser, page: Page):
    """List devices — admins see all, everyone else sees only their own."""
    devices = device_service.list_devices(
        DeviceRepository(session), user, page["skip"], page["limit"]
    )
    usernames = {u.id: u.username for u in UserRepository(session).list()}
    return [
        DeviceOut(
            id=d.id,
            name=d.name,
            is_active=d.is_active,
            last_seen_at=d.last_seen_at,
            created_at=d.created_at,
            owner_id=d.owner_id,
            owner_username=usernames.get(d.owner_id, "unknown"),
        )
        for d in devices
    ]


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, session: SessionDep, user: CurrentUser):
    """Get a single device by ID (admins any, others only their own)."""
    device = device_service.get_device(DeviceRepository(session), user, device_id)
    if not device:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    owner = UserRepository(session).get_by_id(device.owner_id)
    return DeviceOut(
        id=device.id,
        name=device.name,
        is_active=device.is_active,
        last_seen_at=device.last_seen_at,
        created_at=device.created_at,
        owner_id=device.owner_id,
        owner_username=owner.username if owner else "unknown",
    )


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, session: SessionDep, admin: AdminUser):
    """Delete a device and all its readings/commands/positions. Admin only."""
    deleted = device_service.delete_device(
        DeviceRepository(session),
        SensorReadingRepository(session),
        PowerReadingRepository(session),
        EnergyAggregateRepository(session),
        ServoCommandRepository(session),
        ServoPositionRepository(session),
        device_id,
    )
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
