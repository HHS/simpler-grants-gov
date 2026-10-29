"""Integration tests for the api.update_opportunity_search_queue trigger.

The trigger keeps opportunity_change_audit populated so the incremental search
sync knows which opportunities to re-index. These tests exercise it directly
against Postgres, covering INSERT/UPDATE (regression) and DELETE (new) on each
of the eight tables the trigger is attached to.
"""

import uuid
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import pytest
from sqlalchemy import text

from src.constants.lookup_constants import OpportunityStatus
from src.db.migrations.constants import opportunity_search_index_queue_trigger_function
from src.db.models.opportunity_models import OpportunityChangeAudit
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
    LinkOpportunitySummaryApplicantTypeFactory,
    LinkOpportunitySummaryFundingCategoryFactory,
    LinkOpportunitySummaryFundingInstrumentFactory,
    OpportunityAssistanceListingFactory,
    OpportunityAttachmentFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)

TRIGGER_TABLES = [
    "opportunity",
    "opportunity_assistance_listing",
    "current_opportunity_summary",
    "opportunity_summary",
    "link_opportunity_summary_funding_instrument",
    "link_opportunity_summary_funding_category",
    "link_opportunity_summary_applicant_type",
    "opportunity_attachment",
]

_FK_NAME = "opportunity_change_audit_opportunity_id_opportunity_fkey"


@pytest.fixture
def search_queue_trigger(db_session, test_api_schema):
    """Install the queue trigger (and the ON DELETE CASCADE foreign key it needs).

    Test schemas are built from SQLAlchemy metadata rather than the alembic
    migrations, so the trigger does not exist by default. Recreate it here using
    the real (schema-prefixed) table names and tear it down afterwards so the
    session-scoped schema is left as the other tests expect it.
    """
    schema = test_api_schema

    db_session.execute(
        text(opportunity_search_index_queue_trigger_function.replace("api.", f"{schema}."))
    )
    for table in TRIGGER_TABLES:
        db_session.execute(
            text(
                f"CREATE OR REPLACE TRIGGER {table}_queue_trigger "
                f"AFTER INSERT OR UPDATE OR DELETE ON {schema}.{table} "
                f"FOR EACH ROW EXECUTE FUNCTION {schema}.update_opportunity_search_queue();"
            )
        )
    db_session.execute(
        text(f"ALTER TABLE {schema}.opportunity_change_audit DROP CONSTRAINT {_FK_NAME}")
    )
    db_session.execute(
        text(
            f"ALTER TABLE {schema}.opportunity_change_audit ADD CONSTRAINT {_FK_NAME} "
            f"FOREIGN KEY (opportunity_id) REFERENCES {schema}.opportunity(opportunity_id) ON DELETE CASCADE"
        )
    )
    db_session.commit()

    yield

    for table in TRIGGER_TABLES:
        db_session.execute(
            text(f"DROP TRIGGER IF EXISTS {table}_queue_trigger ON {schema}.{table}")
        )
    db_session.execute(text(f"DROP FUNCTION IF EXISTS {schema}.update_opportunity_search_queue()"))
    db_session.execute(
        text(f"ALTER TABLE {schema}.opportunity_change_audit DROP CONSTRAINT {_FK_NAME}")
    )
    db_session.execute(
        text(
            f"ALTER TABLE {schema}.opportunity_change_audit ADD CONSTRAINT {_FK_NAME} "
            f"FOREIGN KEY (opportunity_id) REFERENCES {schema}.opportunity(opportunity_id)"
        )
    )
    db_session.commit()


def _is_queued(db_session, opportunity_id: uuid.UUID) -> bool:
    db_session.expire_all()
    return (
        db_session.query(OpportunityChangeAudit)
        .filter_by(opportunity_id=opportunity_id)
        .one_or_none()
        is not None
    )


def _clear_queue(db_session, opportunity_id: uuid.UUID) -> None:
    db_session.query(OpportunityChangeAudit).filter(
        OpportunityChangeAudit.opportunity_id == opportunity_id
    ).delete()
    db_session.commit()


@dataclass
class TriggerTableSpec:
    """How to exercise the trigger for one of the eight tables."""

    table: str
    # Create any rows the target row depends on. Returns (opportunity_id, context)
    # where opportunity_id is None only for the opportunity table itself (it has
    # no parent, so there is nothing queued to clear before the INSERT).
    create_parents: Callable[[], tuple[uuid.UUID | None, Any]]
    # Create (and return) the row whose INSERT/UPDATE/DELETE we are testing.
    create_target: Callable[[Any], Any]
    opportunity_id_of: Callable[[Any], uuid.UUID]
    # Mutate a non-primary-key column so committing issues an UPDATE.
    mutate: Callable[[Any], None]


def _summary_parent():
    opportunity = OpportunityFactory.create(current_opportunity_summary=None)
    summary = OpportunitySummaryFactory.create(opportunity=opportunity, no_link_values=True)
    return opportunity.opportunity_id, summary


SPECS = [
    TriggerTableSpec(
        table="opportunity",
        create_parents=lambda: (None, None),
        create_target=lambda _: OpportunityFactory.create(),
        opportunity_id_of=lambda opp: opp.opportunity_id,
        mutate=lambda opp: setattr(opp, "opportunity_title", "trigger-test-updated"),
    ),
    TriggerTableSpec(
        table="opportunity_assistance_listing",
        create_parents=lambda: (lambda o: (o.opportunity_id, o))(OpportunityFactory.create()),
        create_target=lambda opp: OpportunityAssistanceListingFactory.create(opportunity=opp),
        opportunity_id_of=lambda row: row.opportunity_id,
        mutate=lambda row: setattr(row, "program_title", "trigger-test-updated"),
    ),
    TriggerTableSpec(
        table="current_opportunity_summary",
        create_parents=_summary_parent,
        create_target=lambda summary: CurrentOpportunitySummaryFactory.create(
            opportunity_id=summary.opportunity_id,
            opportunity=summary.opportunity,
            opportunity_summary=summary,
        ),
        opportunity_id_of=lambda row: row.opportunity_id,
        mutate=lambda row: setattr(row, "opportunity_status", OpportunityStatus.CLOSED),
    ),
    TriggerTableSpec(
        table="opportunity_summary",
        create_parents=lambda: (lambda o: (o.opportunity_id, o))(
            OpportunityFactory.create(current_opportunity_summary=None)
        ),
        create_target=lambda opp: OpportunitySummaryFactory.create(
            opportunity=opp, no_link_values=True
        ),
        opportunity_id_of=lambda row: row.opportunity_id,
        mutate=lambda row: setattr(row, "summary_description", "trigger-test-updated"),
    ),
    TriggerTableSpec(
        table="link_opportunity_summary_funding_instrument",
        create_parents=_summary_parent,
        create_target=lambda summary: LinkOpportunitySummaryFundingInstrumentFactory.create(
            opportunity_summary=summary
        ),
        opportunity_id_of=lambda row: row.opportunity_summary.opportunity_id,
        mutate=lambda row: setattr(row, "legacy_funding_instrument_id", 12345),
    ),
    TriggerTableSpec(
        table="link_opportunity_summary_funding_category",
        create_parents=_summary_parent,
        create_target=lambda summary: LinkOpportunitySummaryFundingCategoryFactory.create(
            opportunity_summary=summary
        ),
        opportunity_id_of=lambda row: row.opportunity_summary.opportunity_id,
        mutate=lambda row: setattr(row, "legacy_funding_category_id", 12345),
    ),
    TriggerTableSpec(
        table="link_opportunity_summary_applicant_type",
        create_parents=_summary_parent,
        create_target=lambda summary: LinkOpportunitySummaryApplicantTypeFactory.create(
            opportunity_summary=summary
        ),
        opportunity_id_of=lambda row: row.opportunity_summary.opportunity_id,
        mutate=lambda row: setattr(row, "legacy_applicant_type_id", 12345),
    ),
    TriggerTableSpec(
        table="opportunity_attachment",
        create_parents=lambda: (lambda o: (o.opportunity_id, o))(OpportunityFactory.create()),
        create_target=lambda opp: OpportunityAttachmentFactory.create(opportunity=opp),
        opportunity_id_of=lambda row: row.opportunity_id,
        mutate=lambda row: setattr(row, "file_description", "trigger-test-updated"),
    ),
]


@pytest.mark.parametrize("spec", SPECS, ids=lambda spec: spec.table)
def test_insert_queues_opportunity(enable_factory_create, search_queue_trigger, spec):
    """Regression: INSERT on each trigger table queues the correct opportunity_id."""
    db_session = enable_factory_create

    parent_opportunity_id, context = spec.create_parents()
    if parent_opportunity_id is not None:
        _clear_queue(db_session, parent_opportunity_id)

    target = spec.create_target(context)
    opportunity_id = spec.opportunity_id_of(target)

    assert _is_queued(db_session, opportunity_id)


@pytest.mark.parametrize("spec", SPECS, ids=lambda spec: spec.table)
def test_update_queues_opportunity(enable_factory_create, search_queue_trigger, spec):
    """Regression: UPDATE on each trigger table queues the correct opportunity_id."""
    db_session = enable_factory_create

    _, context = spec.create_parents()
    target = spec.create_target(context)
    opportunity_id = spec.opportunity_id_of(target)

    _clear_queue(db_session, opportunity_id)

    spec.mutate(target)
    db_session.commit()

    assert _is_queued(db_session, opportunity_id)


# The opportunity table is deleted through its own path (see the cascade test
# below), so it is excluded here.
_DELETE_SPECS = [spec for spec in SPECS if spec.table != "opportunity"]


@pytest.mark.parametrize("spec", _DELETE_SPECS, ids=lambda spec: spec.table)
def test_delete_queues_opportunity(enable_factory_create, search_queue_trigger, spec):
    """New: DELETE on each relationship table queues the correct opportunity_id."""
    db_session = enable_factory_create

    _, context = spec.create_parents()
    target = spec.create_target(context)
    opportunity_id = spec.opportunity_id_of(target)

    _clear_queue(db_session, opportunity_id)

    db_session.delete(target)
    db_session.commit()

    assert _is_queued(db_session, opportunity_id)


def test_delete_opportunity_cascades_and_does_not_dangle(
    enable_factory_create, search_queue_trigger, db_session
):
    """Deleting an opportunity must not leave (or fail on) a dangling queue row."""
    # The child-row deletes fire the trigger while the opportunity still exists, so
    # only the ON DELETE CASCADE foreign key keeps the delete from violating the
    # queue's foreign key. The full default graph exercises every child table.
    opportunity = OpportunityFactory.create()
    opportunity_id = opportunity.opportunity_id

    assert _is_queued(db_session, opportunity_id)

    db_session.delete(opportunity)
    db_session.commit()

    assert not _is_queued(db_session, opportunity_id)
