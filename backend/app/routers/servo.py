"""
Servo Router — Manual override commands (admin) and execution (device).

Admin-facing (identified by device_id in the path):
  POST /servo/{device_id}/commands         — issue a manual override command
  GET  /servo/{device_id}/commands         — command history
  GET  /servo/{device_id}/position         — reported position history
  GET  /servo/{device_id}/position/latest  — most recent reported position

Device-facing (device identified by its own API key, not a path param —
a device only ever acts on its own commands/position):
  GET   /servo/commands/pending   — poll for commands to execute
  PATCH /servo/commands/{id}      — report execution progress
  POST  /servo/position           — report current position
"""

from fastapi import APIRouter, status

from backend.app.dependencies import AdminUser, CurrentDevice, Page, SessionDep
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.repositories.servo_command_repository import ServoCommandRepository
from backend.app.repositories.servo_position_repository import ServoPositionRepository
from backend.app.schemas.servo_command import (
    ServoCommandCreate,
    ServoCommandOut,
    ServoCommandStatusUpdate,
)
from backend.app.schemas.servo_position import ServoPositionCreate, ServoPositionOut
from backend.app.services import servo_service

router = APIRouter(prefix="/servo", tags=["servo"])


# --- Admin-facing ---


@router.post(
    "/{device_id}/commands",
    response_model=ServoCommandOut,
    status_code=status.HTTP_201_CREATED,
)
def issue_command(
    device_id: int, data: ServoCommandCreate, session: SessionDep, admin: AdminUser
):
    """Issue a manual override target position for a device. Admin only."""
    return servo_service.issue_command(
        ServoCommandRepository(session),
        DeviceRepository(session),
        device_id,
        admin,
        data,
    )


@router.get("/{device_id}/commands", response_model=list[ServoCommandOut])
def list_commands(device_id: int, session: SessionDep, admin: AdminUser, page: Page):
    """Command history for a device. Admin only."""
    return servo_service.list_commands_for_device(
        ServoCommandRepository(session), device_id, page["skip"], page["limit"]
    )


@router.get("/{device_id}/position", response_model=list[ServoPositionOut])
def list_positions(device_id: int, session: SessionDep, admin: AdminUser, page: Page):
    """Reported position history for a device. Admin only."""
    return servo_service.get_positions_for_device(
        ServoPositionRepository(session), device_id, page["skip"], page["limit"]
    )


@router.get("/{device_id}/position/latest", response_model=ServoPositionOut | None)
def latest_position(device_id: int, session: SessionDep, admin: AdminUser):
    """Most recently reported position for a device. Admin only."""
    return ServoPositionRepository(session).get_latest_for_device(device_id)


# --- Device-facing ---


@router.get("/commands/pending", response_model=list[ServoCommandOut])
def pending_commands(session: SessionDep, device: CurrentDevice):
    """Device polls this to find commands it still needs to execute."""
    return servo_service.list_pending_for_device(ServoCommandRepository(session), device)


@router.patch("/commands/{command_id}", response_model=ServoCommandOut)
def update_command_status(
    command_id: int,
    data: ServoCommandStatusUpdate,
    session: SessionDep,
    device: CurrentDevice,
):
    """Device reports execution progress on one of its own commands."""
    return servo_service.update_command_status(
        ServoCommandRepository(session), device, command_id, data
    )


@router.post(
    "/position", response_model=ServoPositionOut, status_code=status.HTTP_201_CREATED
)
def report_position(
    data: ServoPositionCreate, session: SessionDep, device: CurrentDevice
):
    """Device reports its current servo position."""
    return servo_service.report_position(
        ServoPositionRepository(session), DeviceRepository(session), device, data
    )
