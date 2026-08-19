# Metabase Backup v2 and Restore: Directory Format

This document describes the shared on-disk format used by `backup_v2.py`
(reads from Metabase, writes local files) and `restore.py` (reads local
files, writes to Metabase). The two modules must agree byte-for-byte on
this format -- anything that differs between them is exactly the kind of
divergence bug this document exists to prevent.

This format also captures dashboards and the sidecar metadata
(display type, visualization settings, template tags, filter parameters)
needed to recreate a fully working question or dashboard from scratch.

## Shared Directory Format

```
metabase-backup-v2/ (or metabase-restore/)
  level_0/                     # questions referenced by other questions
    Shared/
      Ranked_Statuses.sql
      Ranked_Statuses.json
  level_1/                     # the default level -- may reference level_0
    Delivery_Metrics/
      Deliverable_Status_History.sql
      Deliverable_Status_History.json
    Quad_Data/
      Current_Quad.sql
      Current_Quad.json
  dashboards/
    Dashboards/                 # -> Metabase sub-collection name
      Delivery_Metrics.json
```

- The path is `<level_N>/<Collection_Name>/<Question_Name>.sql` -- the
  outer `level_N/` folder controls processing order (so cross-references
  resolve correctly when restoring), and the inner folder name is a
  Metabase sub-collection. Folders sharing a collection name across
  levels collapse into the same sub-collection.
- A question's **key** is its filename without extension (e.g.
  `Ranked_Statuses`), and **must be unique across the entire directory**
  -- there's no per-collection or per-level namespacing. Likewise every
  collection's own leaf name must be unique. `backup-v2` fails fast with
  a combined report naming every collision if the live instance has
  duplicate names anywhere -- rename one of each pair in Metabase and
  re-run.
- **When authoring restore content by hand, default new questions to
  `level_1`** (or the deepest level already in use), not `level_0`. Only
  move a question down to a lower level at the moment another question
  actually needs to reference it -- `level_0` is reserved for building
  blocks with a real consumer, not a place to pre-emptively park anything
  that looks reusable. `backup-v2` assigns levels automatically (by
  topologically sorting the actual reference graph), so this only
  matters when hand-curating restore content directly.
- **Dashboards** get their own `dashboards/<Collection>/<Name>.json` (no
  `.sql` -- a dashboard has no query of its own), one file per dashboard,
  same sub-collection mechanism as questions.

### Sidecar JSON metadata

Each `.sql` file has a sidecar `.json` file (same basename) describing how
the question should be displayed:

```json
{
  "name": "Default Reporting Period",
  "display": "table",
  "visualization_settings": {},
  "description": "Optional description shown in Metabase"
}
```

`display` and `visualization_settings` use Metabase's own vocabulary
directly (`"table"`, `"line"`, `"bar"`, `"scalar"`, etc. for `display`; the
same `visualization_settings` shape Metabase's `GET /api/card/<id>` returns
for that field). A missing `.json` file is fine when hand-authoring -- the
question is still created, just as a bare table with a filename-derived
name; `backup-v2` always writes one.

If a question uses a Metabase filter widget (`{{quad}}`,
`{{deliverable_title}}`, a date picker, etc.), the sidecar also needs
`template_tags` and `parameters`, matching that same `GET /api/card/<id>`
response shape (`dataset_query.native["template-tags"]` and the top-level
`parameters`, respectively):

```json
{
  "name": "All Deliverables - Percent Pointed",
  "display": "row",
  "visualization_settings": {},
  "template_tags": {
    "quad": {
      "type": "dimension",
      "name": "quad",
      "dimension": ["field", 307, null],
      "field_ref": {"schema": "app", "table": "gh_quad", "column": "name"},
      "widget-type": "string/=",
      "display-name": "Quad",
      "default": ["2026-Q3"],
      "required": true
    }
  },
  "parameters": [
    {
      "type": "string/=",
      "target": ["dimension", ["template-tag", "quad"]],
      "name": "Quad",
      "slug": "quad",
      "default": ["2026-Q3"],
      "required": true
    }
  ]
}
```

**Cross-instance field ids**: a `dimension`-type template tag's `"dimension":
["field", <id>, null]` hardcodes a Metabase-internal field ID from the
instance it was copied from -- not guaranteed to mean the same column (or
even belong to the same database) on a different instance's own schema
sync. `backup-v2` also captures `field_ref` (the field's schema/table/
column name, resolved via `GET /api/database/<id>/metadata`), and `restore`
re-resolves it to whichever id that column actually has on the target
instance before posting, rather than trusting the source instance's id
verbatim. A tag with no `field_ref` (an older backup, or hand-authored
restore content) falls back to using its raw `dimension` id as-is -- fine
when restoring to the same instance it came from, but not guaranteed
otherwise. If the referenced column genuinely doesn't exist on the target
database, `restore` fails fast, naming the missing schema/table/column
rather than surfacing Metabase's own less legible field-mismatch error.
Non-dimension tags (plain `text`/`date`/`number` variables, like a raw
`{{date}}`) don't have this problem since they don't reference a field at
all. `backup-v2` copies these tags through verbatim; it strips any
`"card"`-type tag (the kind that backs a cross-question reference), since
those get regenerated fresh when restoring (see below) and carrying stale
ids forward serves no purpose.

Fetching `field_ref` data requires the backup API key to belong to a group 
with "Manage table metadata" permission in the Metabase permissions 
grid (Admin -> Permissions -> Data). Without the permission, calls to 
`GET /api/database/<id>/metadata` will return 403; `backup-v2` treats 
that as a missing enrichment rather than a fatal error, logs a warning, 
and falls back to capturing dimension tags without a `field_ref`.

### Cross-question references

Real Metabase syntax uses `{{#<id>-<name>}}` to reference another saved
question by its (numeric, instance-specific) ID. Since that ID isn't
portable across instances or restore runs, files in this directory instead
use a placeholder that's unambiguous against both that syntax and
Metabase's own `{{variable}}` dashboard-filter syntax:

```sql
WITH ranked_statuses AS {{#restore:Ranked_Statuses}}
```

- **On the backup side**, `backup-v2` rewrites every real
  `{{#<id>-<slug>}}` reference it finds to `{{#restore:<key>}}`, using a
  name -> id map built from every card it backs up. A reference to a card
  *outside* this backup (personal/sample/archived) is left untouched as a
  real `{{#<id>-<slug>}}` reference.
- **On the restore side**, `restore` resolves `{{#restore:<name>}}` back
  to a real `{{#<new_id>-<slug>}}` reference using a name -> card-id map
  built as each `level_N/` directory is processed, in ascending numeric
  order. A reference to a question in an equal or later level (or a
  typo) fails fast with an error naming the offending file and the
  unresolved reference, rather than silently creating a broken question.

Metabase requires more than just the substituted SQL text for a
`{{#<id>-<slug>}}` reference to actually run: it also needs a matching
`"card"`-type entry in the card's own `template-tags`, or the created
question fails at query time with `"missing required parameters"` (it
still creates successfully -- this only surfaces once the question is
actually run). Plain `{{variable}}` filters have the same problem, but
fail even harder -- with a raw SQL syntax error, since Metabase doesn't
substitute an undefined one at all. `restore` auto-generates a minimal
default `template-tags` entry for any `{{...}}` left in a question's
final query text that isn't already covered by its sidecar
`template_tags` -- a `"card"`-type entry for a `{{#<id>-<slug>}}`
reference (whether it came from resolving `{{#restore:name}}`, or was
hardcoded directly against a question that already exists outside this
restore run), or a bare `"text"`-type entry for a plain variable. These
auto-generated defaults are a safety net, not a substitute for a real
sidecar definition -- a `dimension`-type filter (like `{{quad}}` above)
still needs its own `template_tags` entry to behave like a real field
filter instead of a generic text box.

### Dashboard schema

```json
{
  "name": "Delivery Metrics",
  "description": null,
  "width": "fixed",
  "auto_apply_filters": true,
  "parameters": [
    {
      "id": "deliverable",
      "slug": "deliverable",
      "name": "Deliverable",
      "type": "string/=",
      "sectionId": "string",
      "isMultiSelect": false,
      "required": true,
      "default": ["Some Deliverable"],
      "values_source_type": "card",
      "values_source_config": {
        "card": "All_Deliverables_Titles",
        "value_field": ["field", "title", {"base-type": "type/Text"}]
      }
    }
  ],
  "tabs": ["Overview", "Details"],
  "dashcards": [
    {
      "tab": "Overview",
      "card": "Deliverable_Percent_Done_by_Issue_Count",
      "col": 0, "row": 0, "size_x": 24, "size_y": 9,
      "visualization_settings": { "...": "copied verbatim from GET /api/dashboard/:id" }
    },
    {
      "tab": "Details",
      "text": "# {{deliverable_title}}",
      "col": 0, "row": 0, "size_x": 24, "size_y": 1,
      "parameter_mappings": [{"parameter": "deliverable", "target_tag": "deliverable_title"}]
    }
  ]
}
```

Key points:

- **`dashcards[].card`** is a question name (the same key used as its
  filename stem) -- resolved to/from the real card id on either side. A
  dashcard with no `card` and a **`text`** field instead is a
  virtual/markdown card (a heading, note, etc.) -- `visualization_settings`
  only needs the markdown text itself; the `virtual_card` wrapper Metabase
  expects is synthesized/stripped automatically on the restore/backup side
  respectively.
- **`parameters[].id`** is a plain string, copied through verbatim in both
  directions (Metabase accepts a client-supplied filter id on creation) --
  `dashcards[].parameter_mappings[].parameter` just echoes that same
  string, and `target_tag` is the target question's own `template_tags`
  key name. Neither needs id resolution.
- **`parameters[].values_source_config.card`** (when a filter's dropdown
  values come from another saved question) is the one other name
  reference resolved on either side, same as `dashcards[].card`.
- A dashboard referencing a question name that can't be resolved (not
  found in any `level_N/` directory when restoring, or referencing a card
  outside the backup's scope when backing up) fails fast, naming the
  dashboard and the missing question.
- **Known gaps**: multi-series (combo chart) dashcards aren't supported.
