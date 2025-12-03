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

export const storeCurrentPage = () => {
  const startURL = `${location.pathname}${location.search}`;
  if (startURL !== "") {
    SessionStorage.setItem("login-redirect", startURL);
  }
};
