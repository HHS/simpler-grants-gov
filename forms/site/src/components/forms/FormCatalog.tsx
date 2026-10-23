import { useStore } from "@nanostores/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  $allForms,
  $familyFilter,
  $filteredForms,
  $groupBy,
  $search,
  $sortBy,
  $statusFilter,
  type FormSummary,
} from "../../stores/formFilters";
import { byFamily, familiesOf, familySlug, NO_FAMILY } from "../../lib/families";

interface Props {
  forms: FormSummary[];
  title: string;
  subtitle: string;
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  prioritized: "Prioritized",
  in_progress: "In Progress",
  migrated: "Migrated",
  ready: "Ready",
};

/** Sort statuses in workflow order, matching the dashboard's Kanban columns. */
const byStatus = (a: string, b: string) => {
  const order = Object.keys(STATUS_LABELS);
  const rank = (s: string) => (order.includes(s) ? order.indexOf(s) : order.length);
  return rank(a) - rank(b) || a.localeCompare(b);
};

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const status = params.getAll("status");
  const family = params.getAll("family");
  const search = params.get("q") ?? "";
  const sortBy = params.get("sort") as "apps_desc" | "apps_asc" | "name" | null;
  const groupBy = params.get("group") as "family" | "status" | "none" | null;
  return { status, family, search, sortBy, groupBy };
}

function writeUrlParams(state: {
  search: string;
  statusFilter: string[];
  familyFilter: string[];
  sortBy: string;
  groupBy: string;
}) {
  const params = new URLSearchParams();
  if (state.search) params.set("q", state.search);
  for (const s of state.statusFilter) params.append("status", s);
  for (const f of state.familyFilter) params.append("family", f);
  if (state.sortBy !== "apps_desc") params.set("sort", state.sortBy);
  if (state.groupBy !== "family") params.set("group", state.groupBy);
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export default function FormCatalog({ forms, title, subtitle }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    $allForms.set(forms);
    const { status, family, search, sortBy, groupBy } = readUrlParams();
    if (status.length) $statusFilter.set(status);
    if (family.length) $familyFilter.set(family);
    if (search) $search.set(search);
    if (sortBy) $sortBy.set(sortBy);
    if (groupBy) $groupBy.set(groupBy);
  }, [forms]);

  const search = useStore($search);
  const statusFilter = useStore($statusFilter);
  const familyFilter = useStore($familyFilter);
  const sortBy = useStore($sortBy);
  const groupBy = useStore($groupBy);
  const filtered = useStore($filteredForms);

  const syncUrl = useCallback(() => {
    writeUrlParams({
      search: $search.get(),
      statusFilter: $statusFilter.get(),
      familyFilter: $familyFilter.get(),
      sortBy: $sortBy.get(),
      groupBy: $groupBy.get(),
    });
  }, []);

  useEffect(() => {
    syncUrl();
  }, [search, statusFilter, familyFilter, sortBy, groupBy, syncUrl]);

  const families = useMemo(
    () => [...new Set(forms.flatMap(familiesOf))].sort(byFamily),
    [forms],
  );
  const statuses = useMemo(
    () => [...new Set(forms.map((f) => f.status))].sort(byStatus),
    [forms],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of forms) counts[f.status] = (counts[f.status] ?? 0) + 1;
    return counts;
  }, [forms]);

  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of forms) {
      for (const family of familiesOf(f)) counts[family] = (counts[family] ?? 0) + 1;
    }
    return counts;
  }, [forms]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [["", filtered] as [string, FormSummary[]]];
    const groups: Record<string, FormSummary[]> = {};
    for (const form of filtered) {
      // A form in several families appears in each of their groups.
      const keys = groupBy === "family" ? familiesOf(form) : [form.status];
      for (const key of keys) (groups[key] ??= []).push(form);
    }
    return Object.entries(groups).sort(([a], [b]) =>
      groupBy === "family" ? byFamily(a, b) : byStatus(a, b),
    );
  }, [filtered, groupBy]);

  function toggleFilter(
    current: string[],
    value: string,
    setter: (v: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  }

  const hasActiveFilters = statusFilter.length > 0 || familyFilter.length > 0;

  const filterContent = (
    <>
      <div className="filter-header">
        <span className="filter-title">Filters</span>
        <button
          className="filter-close-btn"
          type="button"
          onClick={() => setFiltersOpen(false)}
          aria-label="Close filters"
        >
          &times;
        </button>
        {hasActiveFilters && (
          <button
            className="filter-clear"
            type="button"
            onClick={() => {
              $statusFilter.set([]);
              $familyFilter.set([]);
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-section__header">
          <span className="filter-section__title">Status</span>
        </div>
        {statuses.map((s) => (
          <div className="usa-checkbox" key={s}>
            <input
              className="usa-checkbox__input"
              id={`status-${s}`}
              type="checkbox"
              checked={statusFilter.includes(s)}
              onChange={() =>
                toggleFilter(statusFilter, s, (v) => $statusFilter.set(v))
              }
            />
            <label className="usa-checkbox__label" htmlFor={`status-${s}`}>
              <span className="filter-option">
                <span>{STATUS_LABELS[s] ?? s}</span>
                <span className="filter-count">
                  {statusCounts[s] ?? 0}
                </span>
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-section__header">
          <span className="filter-section__title">Family</span>
        </div>
        {families.map((f) => (
          <div className="usa-checkbox" key={f}>
            <input
              className="usa-checkbox__input"
              id={`family-${f}`}
              type="checkbox"
              checked={familyFilter.includes(f)}
              onChange={() =>
                toggleFilter(familyFilter, f, (v) => $familyFilter.set(v))
              }
            />
            <label
              className="usa-checkbox__label"
              htmlFor={`family-${f}`}
            >
              <span className="filter-option">
                <span>{f}</span>
                <span className="filter-count">
                  {familyCounts[f] ?? 0}
                </span>
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="filter-view-results">
        <button type="button" onClick={() => setFiltersOpen(false)}>
          View results
        </button>
      </div>
    </>
  );

  return (
    <>
      <section className="search-hero">
        <div className="grid-container">
          <div className="page-header">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <form className="search-controls" role="search" onSubmit={(e) => e.preventDefault()}>
            <div className="search-bar">
              <input
                className="usa-input"
                type="text"
                value={search}
                onChange={(e) => $search.set(e.target.value)}
                placeholder="Search forms by name, OMB number, or keyword..."
                aria-label="Search forms"
              />
              <button className="usa-button" type="submit">
                Search
              </button>
            </div>
            <button
              className="filter-toggle-btn"
              type="button"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
              {hasActiveFilters && ` (${statusFilter.length + familyFilter.length})`}
            </button>
          </form>

          {hasActiveFilters && (
            <ul className="filter-chips" aria-label="Active filters">
              {statusFilter.map((s) => (
                <li className="filter-chip" key={`chip-status-${s}`}>
                  {STATUS_LABELS[s] ?? s}
                  <button
                    className="filter-chip__remove"
                    type="button"
                    onClick={() => $statusFilter.set(statusFilter.filter((v) => v !== s))}
                    aria-label={`Remove ${STATUS_LABELS[s] ?? s} filter`}
                  >
                    &times;
                  </button>
                </li>
              ))}
              {familyFilter.map((f) => (
                <li className="filter-chip" key={`chip-family-${f}`}>
                  {f}
                  <button
                    className="filter-chip__remove"
                    type="button"
                    onClick={() => $familyFilter.set(familyFilter.filter((v) => v !== f))}
                    aria-label={`Remove ${f} filter`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid-container search-results">
      <div className="grid-row grid-gap-4">
        <aside className="grid-col-12 tablet:grid-col-3">
          <div className={`filter-panel${filtersOpen ? " is-open" : ""}`}>
            <div className="filter-panel__inner">
              {filterContent}
            </div>
          </div>
        </aside>

        <div className="grid-col-12 tablet:grid-col-9">
          <div className="controls-bar">
            <h2 className="results-count">
              {filtered.length} {filtered.length === 1 ? "Form" : "Forms"}
            </h2>
            <div className="sort-group-controls">
              <div className="control-group">
                <label className="control-label" htmlFor="sort-select">Sort by</label>
                <select
                  id="sort-select"
                  className="usa-select"
                  value={sortBy}
                  onChange={(e) =>
                    $sortBy.set(
                      e.target.value as "apps_desc" | "apps_asc" | "name",
                    )
                  }
                >
                  <option value="apps_desc">Apps (high to low)</option>
                  <option value="apps_asc">Apps (low to high)</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
              <div className="control-group">
                <label className="control-label" htmlFor="group-select">Group</label>
                <select
                  id="group-select"
                  className="usa-select"
                  value={groupBy}
                  onChange={(e) =>
                    $groupBy.set(
                      e.target.value as "family" | "status" | "none",
                    )
                  }
                >
                  <option value="family">Family</option>
                  <option value="status">Status</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {grouped.map(([group, groupForms]) => (
            <div key={group}>
              {group && (
                <details open>
                  <summary className="group-header">
                    {groupBy === "status"
                      ? (STATUS_LABELS[group] ?? group)
                      : group}
                    <span className="group-count">
                      {groupForms.length}{" "}
                      {groupForms.length === 1 ? "form" : "forms"}
                    </span>
                  </summary>
                  <ul className="form-card-grid">
                    {groupForms.map((form) => (
                      <li key={form.slug}><FormCard form={form} /></li>
                    ))}
                  </ul>
                </details>
              )}
              {!group && (
                <ul className="form-card-grid">
                  {groupForms.map((form) => (
                    <li key={form.slug}><FormCard form={form} /></li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-base padding-4">
              No forms match your filters.
            </p>
          )}
        </div>
      </div>
      </section>
    </>
  );
}

function FormCard({ form }: { form: FormSummary }) {
  return (
    <a href={`/forms/${form.slug}/`} className="form-card">
      <div className="form-card__header">
        <span className="form-card__title">{form.title}</span>
        <span className="form-card__arrow">&rsaquo;</span>
      </div>
      <div className="form-card__stats">
        <span className="form-card__stat">
          <strong>{form.apps_count.toLocaleString()}</strong>{" "}
          <span className="form-card__stat-label">apps</span>
        </span>
        <span className="form-card__stat">
          <strong>{form.apps_pct}%</strong>{" "}
          <span className="form-card__stat-label">coverage</span>
        </span>
        <span className="form-card__stat">
          <strong>{form.fieldCount}</strong>{" "}
          <span className="form-card__stat-label">fields</span>
        </span>
      </div>
      <div className="form-card__footer">
        <div className="form-card__tags">
          <span
            className={`status-badge status-badge--${form.status.replace("_", "-")}`}
          >
            {STATUS_LABELS[form.status] ?? form.status}
          </span>
        </div>
        <div className="form-card__tags form-card__families">
          <span className="form-card__tags-label">
            {form.family.length === 1 ? "Family" : "Families"}
          </span>
          {form.family.length ? (
            form.family.map((family) => (
              <span key={family} className={`kanban-card__family family--${familySlug(family)}`}>
                {family}
              </span>
            ))
          ) : (
            <span className="form-card__tags-none">{NO_FAMILY}</span>
          )}
        </div>
      </div>
    </a>
  );
}
