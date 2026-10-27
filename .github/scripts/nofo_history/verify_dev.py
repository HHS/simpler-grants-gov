"""Read-only measurements for the original slow-history example; counts only."""

import json
import sys
import time
from uuid import UUID

TARGET = "e5664268-36af-43ca-bf49-61983533041b"


def compare(document):
    from django.contrib.contenttypes.models import ContentType
    from django.db import connection
    from nofos.audits import (
        _legacy_audit_events_for_document,
        _load_audit_events,
        audit_event_formatting_options,
        document_audit_entries,
        format_audit_event,
    )
    from nofos.models import Nofo, Section, Subsection
    from nofos.views import NofoHistoryView

    result = {}
    pages = []
    for label, offset in (("first", 0), ("second", 25)):
        started = time.monotonic()
        ids = list(
            document_audit_entries(document).values_list("event_id", flat=True)[
                offset : offset + 26
            ]
        )
        events = _load_audit_events(ids)
        options = audit_event_formatting_options(events[:25])
        rows = [
            NofoHistoryView.annotate_event_with_should_link_to_diff(
                format_audit_event(e, options)
            )
            for e in events[:25]
        ]
        result[f"{label}_page_ms"] = round((time.monotonic() - started) * 1000)
        result[f"{label}_page_rows"] = len(rows)
        pages.append({e.pk for e in events[:25]})
    result["duplicate_page_events"] = len(pages[0] & pages[1])
    started = time.monotonic()
    legacy = _legacy_audit_events_for_document(
        document, "nofo", "section", "subsection"
    )
    result["legacy_read_ms"] = round((time.monotonic() - started) * 1000)
    old_ids = {e.pk for e in legacy}
    new_ids = set(document_audit_entries(document).values_list("event_id", flat=True))
    result["legacy_visible_events"] = len(old_ids)
    result["indexed_visible_events"] = len(new_ids)
    result["legacy_only_events"] = len(old_ids - new_ids)
    result["indexed_only_events"] = len(new_ids - old_ids)
    result["legacy_only_deleted_objects"] = 0
    # Batch existence checks for the events the old reader would display but
    # the index would omit. Identifiers and event bodies never leave this task.
    for model in (Nofo, Section, Subsection):
        type_id = ContentType.objects.get_for_model(model).pk
        candidates = [
            e for e in legacy if e.pk not in new_ids and e.content_type_id == type_id
        ]
        valid = {}
        for event in candidates:
            try:
                valid[event.pk] = UUID(str(event.object_id))
            except (ValueError, TypeError, AttributeError):
                continue
        live = set(
            model.objects.filter(pk__in=set(valid.values())).values_list(
                "pk", flat=True
            )
        )
        result["legacy_only_deleted_objects"] += sum(
            oid not in live for oid in valid.values()
        )
    result["postgresql_plan_checked"] = int(connection.vendor == "postgresql")
    result["named_index_seen"] = 0
    if connection.vendor == "postgresql":
        plan = (
            document_audit_entries(document)
            .values_list("event_id", flat=True)[:26]
            .explain(format="json")
        )
        result["named_index_seen"] = int("document_audit_page_idx" in plan)
    return result


def main():
    from django.db import DatabaseError, connection, transaction
    from nofos.models import Nofo

    status, counts = "verification_failed", {}
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
                )
                cursor.execute("SET LOCAL statement_timeout = '30000'")
            document = Nofo.objects.filter(pk=TARGET).first()
            if document is None:
                status = "target_missing"
            else:
                counts = compare(document)
                status = "measured"
    except DatabaseError as error:
        status = (
            "query_timeout"
            if getattr(error.__cause__, "pgcode", None) == "57014"
            else "verification_failed"
        )
        counts = {}
    except Exception:
        # No exception messages/tracebacks: they can contain queries or data.
        status, counts = "verification_failed", {}
    print(
        "NOFO_HISTORY_VERIFICATION "
        + json.dumps({"status": status, "counts": counts}, sort_keys=True)
    )
    if status != "measured":
        sys.exit(1)
