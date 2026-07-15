from typing import Any

import grants_shared.adapters.db as db
from sqlalchemy import event

from src.db.models.resource_models import AbstractResourceTableMixin, MgmtResource


def _handle_resource_automation(
    session: db.Session, flush_context: Any, instances: list[Any] | None
) -> None:
    # Only look at new objects, since the resource ID is also the primary key
    # we shouldn't ever be changing that on an object, so any updates/unmodified
    # objects don't require us to setup the resource.
    for obj in session.new:
        # Only do this for tables we've configured as resource tables
        if isinstance(obj, AbstractResourceTableMixin):
            obj.resource = MgmtResource(
                mgmt_resource_id=obj.get_resource_id(), mgmt_resource_type=obj.get_resource_type()
            )


def setup_resource_automation() -> None:
    """
    Setup resource automation - when a table we consider a resource is created, a row
    will also be created in the resource table. This triggers when we flush records
    to the database which happens as part of commits.

    This effectively lets us turn:

        department = Department(department_id="...")
        resource = Resource(mgmt_resource_id=department.department_id)
        db_session.add(department)
        db_session.add(resource)
        db_session.commit()

    Into just:
        department = Department(department_id="...")
        db_session.add(department)
        db_session.commit()

    Which when these models become increasing complex will be very convenient.
    """

    # To avoid this code running more than once for a given event, make sure we haven't already
    # registered it before. This avoids needing to be overly careful in our tests/app setup.
    if not event.contains(db.Session, "before_flush", _handle_resource_automation):
        event.listen(db.Session, "before_flush", _handle_resource_automation)
