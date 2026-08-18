"""
Shared format-level constants and helpers for the v2 Metabase backup/restore.

`backup_v2.py` (reads from Metabase, writes local files) and `restore.py`
(reads local files, writes to Metabase) must agree byte-for-byte on the
same file format, naming convention, and template-tag shapes -- anything
that differs between them here is exactly the kind of divergence bug this
module exists to prevent.
"""

import re
import uuid
from typing import Any

# Our own cross-question placeholder syntax, e.g. {{#restore:Reporting_Period}}.
# Deliberately distinct from Metabase's own {{#<id>-<name>}} cross-question
# syntax (which starts with a digit) and its {{variable}} dashboard-filter
# syntax (which has no leading #), so there's no ambiguity either way.
RESTORE_REFERENCE_PATTERN = re.compile(r"\{\{#restore:([A-Za-z0-9_-]+)\}\}")

# Metabase's own resolved cross-question reference syntax, e.g. {{#143-name}}.
CARD_TAG_PATTERN = re.compile(r"\{\{(#\d+-[a-zA-Z0-9-]+)\}\}")

# Metabase's own plain filter-variable syntax, e.g. {{quad}}.
VARIABLE_TAG_PATTERN = re.compile(r"\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}")

# Set as every restore-created top-level collection's description, so
# backup-v2 can recognize and exclude it regardless of the --collection-name
# a given restore run used -- a collection name alone isn't a reliable
# signal, since it's a free-form argument, not a fixed convention.
RESTORE_COLLECTION_DESCRIPTION = (
    "Created by `analytics metabase restore`. Excluded from backup-v2 automatically."
)


def clean_name(name: str) -> str:
    """Turn a display name into a filesystem-safe key (e.g. for filenames)."""
    cleaned = ""
    for char in name:
        if char.isalnum():
            cleaned += char
        elif not cleaned or cleaned[-1] != "_":
            cleaned += "_"
    return cleaned.strip("_")


def slugify(name: str) -> str:
    """Turn a display name into a Metabase-style reference slug."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return slug or "question"


def build_card_tag(tag_name: str, card_id: int) -> dict[str, Any]:
    """Build a "card"-type template-tag entry for a {{#<id>-<slug>}} reference."""
    return {
        "id": str(uuid.uuid4()),
        "name": tag_name,
        "display-name": tag_name,
        "type": "card",
        "card-id": card_id,
    }


def build_text_tag(tag_name: str) -> dict[str, Any]:
    """Build a minimal "text"-type template-tag entry for a plain {{variable}}."""
    return {
        "id": str(uuid.uuid4()),
        "name": tag_name,
        "display-name": tag_name.replace("_", " ").title(),
        "type": "text",
    }
