"""
Servo Service — manual override command issuing/polling and position reporting.

This is for admin manual override only: the automatic LDR-driven
tracking loop runs locally on the device firmware and never touches
this service. See app.models.servo_command for the pending ->
acknowledged -> done lifecycle.
"""

from fastapi import HTTPException, status

from backend.app.models.device import Device
from backend.app.models.servo_command import ServoCommand
from backend.app.models.servo_position import ServoPosition
from backend.app.models.user import User
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.repositories.servo_command_repository import ServoCommandRepository
from backend.app.repositories.servo_position_repository import ServoPositionRepository
from backend.app.schemas.servo_command import ServoCommandCreate, ServoCommandStatusUpdate
from backend.app.schemas.servo_position import ServoPositionCreate
from backend.app.services import device_service


def issue_command(
    command_repo: ServoCommandRepository,
    device_repo: DeviceRepository,
    device_id: int,
    admin_user: User,
    data: ServoCommandCreate,
) -> ServoCommand:
    """Admin issues a manual override target position for a device."""
    if device_service.get_device(device_repo, admin_user, device_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    command = ServoCommand(
        device_id=device_id,
        issued_by=admin_user.id,
        target_x_angle=data.target_x_angle,
        target_y_angle=data.target_y_angle,
    )
    return command_repo.create(command)


def list_pending_for_device(
    command_repo: ServoCommandRepository, device: Device
) -> list[ServoCommand]:
    """The device polls this to find commands it still needs to execute."""
    return command_repo.list_pending_for_device(device.id)


def update_command_status(
    command_repo: ServoCommandRepository,
    device: Device,
    command_id: int,
    data: ServoCommandStatusUpdate,
) -> ServoCommand:
    """
    The device reports progress as it acknowledges/executes a command.

    A device may only update its own commands.
    """
    command = command_repo.get_by_id(command_id)
    if command is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Command not found")
    if command.device_id != device.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Cannot update another device's command"
        )
    command.status = data.status
    return command_repo.update(command)


def list_commands_for_device(
    command_repo: ServoCommandRepository, device_id: int, skip: int, limit: int
) -> list[ServoCommand]:
    """Command history for a device. Admin-only — enforce at the router."""
    return command_repo.list_for_device(device_id, skip=skip, limit=limit)


def report_position(
    position_repo: ServoPositionRepository,
    device_repo: DeviceRepository,
    device: Device,
    data: ServoPositionCreate,
) -> ServoPosition:
    """The device reports its actual current position (tracking or override)."""
    position = ServoPosition(
        device_id=device.id, x_angle=data.x_angle, y_angle=data.y_angle
    )
    position = position_repo.create(position)
    device_service.record_heartbeat(device_repo, device)
    return position


def get_positions_for_device(
    position_repo: ServoPositionRepository, device_id: int, skip: int, limit: int
) -> list[ServoPosition]:
    """Position history for a device. Admin-only — enforce at the router."""
    return position_repo.list_for_device(device_id, skip=skip, limit=limit)
