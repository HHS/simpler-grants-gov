"""Count unresolved audit ownership without logging identifiers or payloads.

Executed inside Django's shell in the deployed dev application. PostgreSQL
enforces a read-only transaction; this code never calls ownership write helpers.
"""

import json
from collections import Counter
from uuid import UUID

from django.contrib.contenttypes.models import ContentType
from django.db import connection, transaction
from django.db.models import Q
from easyaudit.models import CRUDEvent

from nofos.history_index import ROOTS, SECTIONS, SUBSECTIONS
from nofos.models import AuditObjectDocument, DocumentAuditEvent


def uuid(value):
    try:
        return UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def fields(payload):
    try:
        data = json.loads(payload)
    except (ValueError, TypeError):
        return {}, "invalid_json"
    if isinstance(data, dict):
        value = data.get("fields", data)
        return value if isinstance(value, dict) else {}, "dict_snapshot"
    if not isinstance(data, list) or not data or not isinstance(data[0], dict):
        return {}, "empty_or_invalid_list"
    value = data[0].get("fields")
    return value if isinstance(value, dict) else {}, "list_snapshot"


def diagnose():
    counts = Counter()
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION READ ONLY")
            cursor.execute("SET LOCAL statement_timeout = '300000'")
        types = {
            (ct.app_label, ct.model): ct
            for ct in ContentType.objects.filter(app_label__in=["nofos", "composer"])
        }
        relevant = Q(pk__in=[])
        for key in ROOTS | SECTIONS | SUBSECTIONS:
            if key in types:
                relevant |= Q(content_type=types[key])
        missing = (
            CRUDEvent.objects.filter(relevant)
            .exclude(pk__in=DocumentAuditEvent.objects.values("event_id"))
            .select_related("content_type")
            .defer("changed_fields", "object_repr")
            .order_by("pk")
        )
        total = missing.count()
        for event in missing.iterator(chunk_size=100):
            key = (event.content_type.app_label, event.content_type.model)
            prefix = ".".join(key)
            counts[f"{prefix}:total"] += 1
            counts[f"{prefix}:event_type_{event.event_type}"] += 1
            data, shape = fields(event.object_json_repr)
            counts[f"{prefix}:{shape}"] += 1
            oid = uuid(event.object_id)
            if not oid:
                counts[f"{prefix}:invalid_object_uuid"] += 1
                continue
            if AuditObjectDocument.objects.filter(
                content_type=event.content_type, object_id=oid
            ).exists():
                counts[f"{prefix}:retained_object_ownership"] += 1
            model = event.content_type.model_class()
            if model and model.objects.filter(pk=oid).exists():
                counts[f"{prefix}:live_object"] += 1
            for name in (
                "nofo",
                "nofo_id",
                "section",
                "section_id",
                "content_guide",
                "content_guide_id",
                "content_guide_instance",
                "content_guide_instance_id",
            ):
                if uuid(data.get(name)):
                    counts[f"{prefix}:uuid_field_{name}"] += 1
            if key in SUBSECTIONS:
                parent_key = (
                    key[0],
                    "section" if key[0] == "nofos" else "contentguidesection",
                )
                parent_ct = types.get(parent_key)
                parent_id = uuid(data.get("section"))
                if parent_ct and parent_id:
                    if AuditObjectDocument.objects.filter(
                        content_type=parent_ct, object_id=parent_id
                    ).exists():
                        counts[f"{prefix}:retained_parent_ownership"] += 1
                    if parent_ct.model_class().objects.filter(pk=parent_id).exists():
                        counts[f"{prefix}:live_parent"] += 1
                    if CRUDEvent.objects.filter(
                        content_type=parent_ct, object_id=str(parent_id)
                    ).exists():
                        counts[f"{prefix}:parent_audit_exists"] += 1
        print(
            "NOFO_HISTORY_DIAGNOSTIC "
            + json.dumps(
                {"total_missing": total, "counts": dict(sorted(counts.items()))},
                sort_keys=True,
            )
        )


diagnose()
