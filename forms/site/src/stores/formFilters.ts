import { atom, computed } from "nanostores";

import { familiesOf } from "../lib/families";

export interface FormSummary {
  slug: string;
  title: string;
  status: string;
  /** Grants.gov form families, e.g. ["R&R"]; empty when the form has none. */
  family: string[];
  apps_count: number;
  apps_pct: string;
  fieldCount: number;
  description: string;
  widgets: string[];
}

export const $search = atom("");
export const $statusFilter = atom<string[]>([]);
export const $familyFilter = atom<string[]>([]);
export const $sortBy = atom<"apps_desc" | "apps_asc" | "name">("apps_desc");
export const $groupBy = atom<"family" | "status" | "none">("family");
export const $allForms = atom<FormSummary[]>([]);

export const $filteredForms = computed(
  [$allForms, $search, $statusFilter, $familyFilter, $sortBy],
  (forms, search, statuses, families, sortBy) => {
    let result = forms;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      );
    }
    if (statuses.length > 0) {
      result = result.filter((f) => statuses.includes(f.status));
    }
    if (families.length > 0) {
      result = result.filter((f) =>
        familiesOf(f).some((family) => families.includes(family)),
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "apps_desc":
        sorted.sort((a, b) => b.apps_count - a.apps_count);
        break;
      case "apps_asc":
        sorted.sort((a, b) => a.apps_count - b.apps_count);
        break;
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  },
);
