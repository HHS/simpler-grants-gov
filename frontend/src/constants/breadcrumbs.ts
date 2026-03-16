import { Breadcrumb } from "src/components/Breadcrumbs";

// individual breadcrumbs
const HOME: Breadcrumb = { title: "Home", path: "/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};
const SAVED_OPPORTUNITIES: Breadcrumb = {
  title: "Saved opportunities",
  path: "/saved-opportunities/",
};

// page breadcrumbs
export const SEARCH_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const SAVED_OPPORTUNITIES_CRUMBS: Breadcrumb[] = [
  HOME,
  SAVED_OPPORTUNITIES,
];
