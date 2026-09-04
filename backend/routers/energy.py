"""
Energy Router — Hourly Wh rollups, role-filtered.

GET /energy/{device_id} — regular users see panel generation only,
                           admins also see load consumption.
"""

from fastapi import APIRouter

from app.dependencies import CurrentUser, Page, SessionDep
from app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from app.schemas.energy_aggregate import EnergyAggregateOut
from app.services import energy_service

router = APIRouter(prefix="/energy", tags=["energy"])


@router.get("/{device_id}", response_model=list[EnergyAggregateOut])
def list_energy_aggregates(
    device_id: int, session: SessionDep, user: CurrentUser, page: Page
):
    """Hourly energy (Wh) history for a device, filtered by role."""
    return energy_service.get_aggregates_for(
        EnergyAggregateRepository(session), user, device_id, page["skip"], page["limit"]
    )
