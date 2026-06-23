# Tech Spec: Legacy Saved Opportunities Research

As part of sunsetting grants.gov/search, the opportunities users saved in legacy Grants.gov should carry over to Simpler instead of being lost. Saved searches were dropped at sunset, but saved opportunities were not. Before we design how that import works, we need a clear picture of the legacy data: which tables hold the saves, what we can pull from them, how a save points back to a Simpler opportunity, and what it would take to sync the tables. This document covers that groundwork. It does not propose endpoints or a user flow; that belongs in a later feature spec, once product settles on whether the import happens one save at a time or in bulk.

## Goals and Objectives

- Document which legacy Grants.gov tables hold saved opportunities and what they contain.
- Confirm whether the existing Oracle sync can pull those tables or whether we need new access.
- Describe how a legacy save maps back to a Simpler opportunity.
- Lay out the work to extend the sync, as a foundation for the feature spec that follows.

## Background and Context

Simpler already pulls legacy Grants.gov Alerts data from Oracle through a Foreign Data Wrapper. Foreign tables in the `legacy` schema get copied into `staging` by `load_oracle_data_task.py`, and the set of tables that gets copied is listed in `TABLES_TO_LOAD`. The legacy-user migration follows this same shape: sync into staging, match a user by email, and let them act on what they find. We want to reuse that pattern rather than build anything new.

This ticket started as a full tech spec covering both the import of the tables and the endpoints that would drive it. On 2026-06-22 the team rescoped it. The product requirements and design for importing saved opportunities are still in progress, and the current thinking leans toward a bulk import rather than claiming opportunities one at a time. Until those requirements are settled, the import flow is blocked. The piece that does not depend on that decision is the data itself, so this ticket now covers research only. The list, claim, and ignore endpoints, along with the frontend behavior, move to a separate spec written once design has weighed in.

## Scope

### In Scope

- Identifying the legacy Oracle tables that hold saved opportunities and the columns we need from them.
- Confirming whether the existing Oracle sync covers these tables or whether new access is required.
- Identifying the signal in the legacy data that tells us whether a save is still active.
- Describing how a legacy save maps to a Simpler opportunity, and how often that mapping fails.
- Outlining the work to extend the sync: foreign model, staging model, `TABLES_TO_LOAD` entry, and a migration.

### Out of Scope

- Surfacing a user's saves by email match and showing them a computed status.
- The claim action that brings a save into Simpler, whether through the existing save flow or a dedicated endpoint.
- A dismiss or ignore concept.
- API shape and frontend behavior. These are held back so we don't commit to an interface before design reviews it.
- Backfilling saves for opportunities that were never imported into Simpler.

## Data Model & Mapping

### Core Entities

**TSUBSCRIPTION** holds one row per legacy subscription. It links to a legacy user through `user_account_id`; there is no email column on the table, so email comes from the legacy user join, the same way the existing legacy-user code resolves it. The table carries notification flags (`newsletters`, `alerts`, `all_new_opps`, `opportunities`, `saved_searches`) and timestamps. We ignore `saved_searches`, since searches are out of scope. There is no single unsubscribed flag on this table, which is why the active signal lives on the child table below.

**TSUBSCRIPTION_OPPORTUNITY** holds one row per saved opportunity within a subscription. The columns that matter are `subscription_id` (the link back to the subscription), `opportunity_id` (the legacy opportunity id, which is the mapping key), and `is_opp_deleted` (a text flag for whether the save is still live). Timestamps let us keep the most recent row when a user has the same opportunity saved more than once.

**Opportunity** is the Simpler opportunity. A legacy save maps to it through `Opportunity.legacy_opportunity_id`, an integer column that is indexed and unique (`api/src/db/models/opportunity_models.py:43`).

`TSUBSCRIPTION_OPPORTUNITY_HIST`, the history table, is not needed. Confirmed with @chouinar.

### Telling whether a save is still active

On the legacy side, a save is still live when `is_opp_deleted` is not set to its deleted value, and once synced, when the staging soft-delete flag `is_deleted` is false. There is no subscription-level unsubscribed flag to fall back on, so this per-row flag is what we key on. One caveat worth flagging now: `is_opp_deleted` is a text column, and we should check its actual values against live data rather than assume it is strictly `'Y'` or `'N'`.

The Simpler side has a second half to the active definition. An opportunity is only worth surfacing if it is not archived. `opportunity_status` is not a stored column; it is a derived property (`opportunity_models.py:184`) that reads `CurrentOpportunitySummary.opportunity_status` (the real column, line 472). So the eventual query would join `CurrentOpportunitySummary` and treat archived opportunities, and those with no current summary, as not active. The exact query belongs in the feature spec, but the join is a property of the mapping, so it's worth recording here.

### How often the mapping fails

We don't yet have a number for how often a legacy save has no matching Simpler opportunity. There are two ways a save can fail to match: the opportunity was never imported into Simpler, so there is no `legacy_opportunity_id` row, or it was imported but has no current summary. Once the tables are in staging, the following query gives a first read on the match rate:

```sql
SELECT
  COUNT(*) AS total_saves,
  COUNT(o.opportunity_id) AS matched,
  COUNT(*) - COUNT(o.opportunity_id) AS no_match
FROM staging.tsubscription_opportunity so
LEFT JOIN opportunity o
  ON o.legacy_opportunity_id = so.opportunity_id
WHERE so.is_opp_deleted <> '<deleted-value>';  -- confirm the value first
```

Backfilling opportunities that were never imported is out of scope, so those saves stay unmatched and shape the number.

## Extending the Sync

Most of this work is recovery rather than new code. We synced `tsubscription`, `tsubscription_search`, and `tsubscription_opportunity` once before and removed them in PR #7497. The removed classes are at commit `a9629cfd2^`, in `user_mixin.py`, `foreign/user.py`, and `staging/user.py`, and we can lift them into new `subscription.py` files. The legacy-users migration `2025_11_12_add_legacy_users_foreign_staging_tables.py` is a good reference for current conventions.

The work breaks down as:

- Foreign models for `TSUBSCRIPTION` and `TSUBSCRIPTION_OPPORTUNITY`, recovered and brought up to date from #7497.
- Staging models for both, including the `is_deleted` soft-delete flag.
- Entries for both tables in `TABLES_TO_LOAD`.
- A migration that adds the foreign and staging tables.

We do not restore `tsubscription_search`, since searches are out of scope, and we do not add the history table.

## Risks / Assumptions

### Key Risks

- We don't yet know the real values of `is_opp_deleted`. The whole active signal rests on it, so it needs to be checked against live data before anyone relies on it.
- The no-match rate is unknown until the tables are in staging and the query above can run. If it turns out to be high, it changes how useful the import is and is worth raising with product.

### Assumptions

- `TSUBSCRIPTION` and `TSUBSCRIPTION_OPPORTUNITY` still live in the same Oracle source we synced from before #7497, so extending the sync is a code change and not a new integration.
- Access is not a concern. Per @chouinar, our user was granted access to every table in the source a while back, so there are no restrictions to clear. For the eventual feature it's worth confirming this access is standing rather than one-time, since it crosses vendors.
- On the Simpler side, "active" maps to `opportunity_status` not being archived, and on the legacy side to `is_opp_deleted`.
