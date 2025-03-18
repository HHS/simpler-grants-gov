import { Breadcrumb, BreadcrumbList } from "src/components/Breadcrumbs";

const HOME: Breadcrumb = { title: "Home", path: "/" };
const RESEARCH: Breadcrumb = { title: "Research", path: "/research/" };
const SUBSCRIBE: Breadcrumb = { title: "Subscribe", path: "/subscribe/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};
export const SUBSCRIBE_CONFIRMATION: Breadcrumb = {
  title: "Confirmation",
  path: "/subscribe/confirmation/",
};
const UNSUBSCRIBE: Breadcrumb = {
  title: "Unsubscribe",
  path: "/subscribe/unsubscribe/",
};
const SAVED_GRANTS: Breadcrumb = {
  title: "Saved grants",
  path: "/saved-grants/",
};

export const RESEARCH_CRUMBS: BreadcrumbList = [HOME, RESEARCH];
export const SUBSCRIBE_CRUMBS: BreadcrumbList = [HOME, SUBSCRIBE];
export const SUBSCRIBE_CONFIRMATION_CRUMBS: BreadcrumbList = [
  HOME,
  SUBSCRIBE,
  SUBSCRIBE_CONFIRMATION,
];
export const UNSUBSCRIBE_CRUMBS: BreadcrumbList = [
  HOME,
  SUBSCRIBE,
  UNSUBSCRIBE,
];
export const SEARCH_CRUMBS: BreadcrumbList = [HOME, SEARCH];
export const OPPORTUNITY_CRUMBS: BreadcrumbList = [HOME, SEARCH];
export const SAVED_GRANTS_CRUMBS: BreadcrumbList = [HOME, SAVED_GRANTS];
