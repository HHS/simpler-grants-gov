import {
  LOGIN_REDIRECT_BLOCKED_PREFIXES,
  LOGIN_REDIRECT_FALLBACK,
  LOGIN_REDIRECT_STORAGE_KEY,
} from "src/constants/auth";
import SessionStorage from "src/services/sessionStorage/sessionStorage";
import { Organization } from "src/types/applicationResponseTypes";
import { UserPrivilegesResponse } from "src/types/userTypes";

// find the user's role within the passed organization
export const userRoleForOrganization = (
  organization: Organization,
  user: UserPrivilegesResponse,
): string => {
  const organizationPrivilegeSet = user.organization_users.find(
    (role) =>
      role.organization.organization_id === organization.organization_id,
  );
  if (!organizationPrivilegeSet) {
    console.error("no user roles for organization");
    return "";
  }
  return organizationPrivilegeSet.organization_user_roles.length > 1
    ? organizationPrivilegeSet.organization_user_roles
        .map((role) => role.role_name)
        .join(", ")
    : organizationPrivilegeSet.organization_user_roles[0].role_name;
};

export const storeCurrentPage = (pathname: string, search: string) => {
  const startURL = `${pathname}${search}`;
  if (startURL !== "") {
    SessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, startURL);
  }
};

const LOGIN_REDIRECT_BASE_URL = "https://simpler.invalid";

const isBlockedLoginRedirectPath = (pathname: string) => {
  const lowerCasePathname = pathname.toLowerCase();
  return LOGIN_REDIRECT_BLOCKED_PREFIXES.some(
    (prefix) =>
      lowerCasePathname === prefix ||
      lowerCasePathname.startsWith(`${prefix}/`),
  );
};

export const isSafeLoginRedirect = (
  destination: unknown,
): destination is string => {
  if (
    typeof destination !== "string" ||
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    /[\\\s\p{Cc}]/u.test(destination)
  ) {
    return false;
  }
  let url: URL;
  let decodedPathname: string;
  try {
    url = new URL(destination, LOGIN_REDIRECT_BASE_URL);
    decodedPathname = decodeURI(url.pathname);
    decodeURI(destination);
  } catch {
    return false;
  }
  return (
    url.origin === LOGIN_REDIRECT_BASE_URL &&
    !isBlockedLoginRedirectPath(url.pathname) &&
    !isBlockedLoginRedirectPath(decodedPathname)
  );
};

export const getSafeLoginRedirect = (destination: unknown): string =>
  isSafeLoginRedirect(destination) ? destination : LOGIN_REDIRECT_FALLBACK;
