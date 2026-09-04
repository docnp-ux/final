"""
Shared schema utilities.

The DB stores every timestamp as UTC (see the various `_utcnow()` model
helpers), but SQLAlchemy/Postgres round-trips them as naive datetimes
(no tzinfo attached) unless the column is explicitly TIMESTAMPTZ. A
naive datetime serializes to JSON without a "Z"/offset suffix — and a
timestamp string with no timezone marker gets parsed as *local* time by
JavaScript's `Date`, silently shifting every timestamp in the frontend
by the browser's UTC offset. `UtcDatetime` fixes this at the API
boundary: it stamps a naive datetime as UTC before serializing, so the
JSON always carries an explicit offset and clients parse it correctly.
"""

from datetime import datetime, timezone
from typing import Annotated

from pydantic import PlainSerializer


def _serialize_as_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


UtcDatetime = Annotated[datetime, PlainSerializer(_serialize_as_utc, return_type=str)]
