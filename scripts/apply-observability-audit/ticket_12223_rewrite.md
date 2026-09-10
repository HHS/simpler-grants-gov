### Summary

Five small backend logging changes so the Apply funnel can be sliced and joined
in New Relic. Every value already exists in memory where we log it — nothing new
is computed and no new events are added. Four are adding a field to an existing
`extra={...}`; one moves a call earlier so an existing log line carries fields it
should already have.

Grouped as one ticket because each is a few lines. If it needs trimming, keep
item 1 (form save outcome) — it feeds the key metric and three derived ones; items
2–5 can move to a follow-up.

How to prove each item: a unit test using pytest `caplog` that asserts the named
log record carries the field with the expected value (extra fields land as
attributes on the record, e.g. `record.warning_count`). The NRQL lines are the
staging confirmation, not the unit-level proof.

### Acceptance criteria

**1. Form save outcome on `form_updated` (protect this one)**
`src/services/applications/update_application_form.py`, the
`logger.info("Updated application ...")` call (~line 145).

- [ ] The log line's `extra` includes `warning_count = len(warnings)` (the integer count, not the warnings list)
- [ ] It includes `application_form_status = application_form.application_form_status` (the value `validate_application_form` just set)
- [ ] It includes `is_required = competition_form.is_required`
- [ ] The warnings list itself is not added to the log (avoids the forwarder truncating at 3000 chars)
- [ ] Unit test: a save with validation warnings logs `warning_count > 0` and `application_form_status == "in_progress"`; a clean save logs `warning_count == 0` and `application_form_status == "complete"`

**2. `application_created` carries opportunity_id / agency_code**
`src/services/applications/create_application.py`.

- [ ] `add_application_metadata_to_logs(application)` is called before the `APPLICATION_CREATED` `add_audit_event(...)` (it currently runs at the end of the function, ~line 216, so the audit log line misses these fields)
- [ ] Unit test: creating an application emits the `application_created` audit log record with `opportunity_id` and `agency_code` present and non-null

**3. Add-organization PUT carries opportunity_id / agency_code**
`src/api/application_alpha/application_route.py`, `application_add_organization`
(~line 115).

- [ ] After the application is loaded, `add_application_metadata_to_logs(application)` is called so the request logs carry `opportunity_id` and `agency_code` (today only `application_id` and `organization_id` are logged)
- [ ] Unit test: `PUT /alpha/applications/:id/organizations/:org_id` produces a log record with `opportunity_id` present

**4. Audit-history endpoint logs application_id**
`src/api/application_alpha/application_route.py`, `application_audit_list`
(~line 370).

- [ ] `add_extra_data_to_current_request_logs({"application_id": application_id})` is called at the top of the handler (the path param is not currently logged)
- [ ] Unit test: `POST /alpha/applications/:id/audit_history` produces log records with `application_id` present

**5. Dimensions on create: role, intent, simpler-enabled**
`src/services/applications/create_application.py`.

- [ ] `intends_to_add_organization` is added to the create log/metadata (value read ~line 101)
- [ ] `is_simpler_grants_enabled` (from `application.competition`) is added to the create log/metadata
- [ ] The assigned role is logged on create — either add `role = "application_owner"` to the `_assign_application_owner_role` log line, or include it in the create metadata
- [ ] Unit test: creating an application logs `intends_to_add_organization`, `is_simpler_grants_enabled`, and the role

### Out of scope

- The null `application_id` on audit events is #12219, not here.
- No new audit events or metrics jobs; this is only enriching existing log lines.
