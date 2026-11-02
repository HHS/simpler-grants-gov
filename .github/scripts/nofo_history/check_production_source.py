"""Fixed production readiness probe; executed inside the deployed Django shell."""

import json
import sys
import time

FIELDS = {
    "reader_enabled",
    "relevant_events",
    "indexed_events",
    "missing_events",
    "coverage_checked",
    "legacy_visible_events",
    "indexed_visible_events",
    "legacy_only_events",
    "indexed_only_events",
    "elapsed_ms",
}
TARGET = "e5664268-36af-43ca-bf49-61983533041b"


def check():
    from constance import config
    from django.contrib.contenttypes.models import ContentType
    from django.db import DatabaseError, connection, transaction
    from easyaudit.models import CRUDEvent
    from nofos.audits import _legacy_audit_events_for_document, document_audit_entries
    from nofos.history_index import ROOTS, SECTIONS, SUBSECTIONS
    from nofos.models import DocumentAuditEvent, Nofo

    counts = dict.fromkeys(FIELDS, 0)
    status = "check_failed"
    started = time.monotonic()
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
                )
                cursor.execute("SET LOCAL statement_timeout = '15000'")
                cursor.execute("SET LOCAL lock_timeout = '2000'")
            counts["reader_enabled"] = int(bool(config.DOCUMENT_HISTORY_INDEX_ENABLED))
            if counts["reader_enabled"]:
                status = "reader_enabled"
            else:
                types = [
                    ct.pk
                    for ct in ContentType.objects.filter(
                        app_label__in=["nofos", "composer"]
                    )
                    if (ct.app_label, ct.model) in ROOTS | SECTIONS | SUBSECTIONS
                ]
                events = CRUDEvent.objects.filter(content_type_id__in=types)
                counts["relevant_events"] = events.count()
                counts["missing_events"] = events.exclude(
                    pk__in=DocumentAuditEvent.objects.values("event_id")
                ).count()
                counts["indexed_events"] = (
                    counts["relevant_events"] - counts["missing_events"]
                )
                if counts["missing_events"]:
                    status = "index_incomplete"
                elif not counts["relevant_events"]:
                    status = "empty_audit"
                else:
                    document = Nofo.objects.filter(pk=TARGET).first()
                    if document is None:
                        status = "target_missing"
                    else:
                        legacy = {
                            e.pk
                            for e in _legacy_audit_events_for_document(
                                document, "nofo", "section", "subsection"
                            )
                        }
                        indexed = set(
                            document_audit_entries(document).values_list(
                                "event_id", flat=True
                            )
                        )
                        counts.update(
                            coverage_checked=1,
                            legacy_visible_events=len(legacy),
                            indexed_visible_events=len(indexed),
                            legacy_only_events=len(legacy - indexed),
                            indexed_only_events=len(indexed - legacy),
                        )
                        status = (
                            "target_empty"
                            if not legacy and not indexed
                            else "coverage_mismatch" if legacy != indexed else "ready"
                        )
    except DatabaseError as error:
        status = (
            "query_timeout"
            if getattr(error.__cause__, "pgcode", None) in {"57014", "55P03"}
            else "check_failed"
        )
    except Exception:
        # Exception and SQL text may contain private audit data.
        status = "check_failed"
    counts["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    print(
        "NOFO_HISTORY_PRODUCTION_CHECK "
        + json.dumps({"status": status, "counts": counts}, sort_keys=True)
    )
    return status == "ready"
