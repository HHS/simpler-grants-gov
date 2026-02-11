import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)


def ingest_workflow_event(json_data: dict[str, Any]) -> uuid.UUID:
    """
    Stub for ingesting workflow events.
    """

    # Model conversion to be implemented

    event_id = uuid.uuid4()

    logger.info(
        "Ingested workflow event",
        extra={"event_id": event_id, "event_type": json_data.get("event_type")},
    )

    return event_id
