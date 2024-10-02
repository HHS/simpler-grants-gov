import { Breadcrumb, BreadcrumbList } from "src/components/Breadcrumbs";

const HOME: Breadcrumb = { title: "Home", path: "/" };
const RESEARCH: Breadcrumb = { title: "Research", path: "/research/" };
const PROCESS: Breadcrumb = { title: "Process", path: "/process/" };
const SUBSCRIBE: Breadcrumb = { title: "Subscribe", path: "/subscribe/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search?status=forecasted,posted",
};
export const SUBSCRIBE_CONFIRMATION: Breadcrumb = {
  title: "Confirmation",
  path: "/subscribe/confirmation/",
};
const UNSUBSCRIBE: Breadcrumb = {
  title: "Unsubscribe",
  path: "/subscribe/unsubscribe/",
};

export const RESEARCH_CRUMBS: BreadcrumbList = [HOME, RESEARCH];
export const PROCESS_CRUMBS: BreadcrumbList = [HOME, PROCESS];
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
