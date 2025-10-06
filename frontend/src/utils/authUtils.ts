import {
  UserPrivilegeDefinition,
  UserPrivilegesResponse,
} from "src/types/userTypes";

// yes, these functions are completely duplicative at the moment but
// a) managing the typescript to create a resource agnostic function is really hard
// b) we may need to support different behavior per resource type in the future anyway
const getApplicationPrivileges = (
  userPrivileges: UserPrivilegesResponse,
  applicationId: string,
): string[] => {
  return userPrivileges.application_users
    .filter(
      (roleDefinition) =>
        roleDefinition.application.application_id === applicationId,
    )
    .reduce(
      (allPrivileges, orgsForId) =>
        allPrivileges.concat(
          orgsForId.application_user_roles.reduce(
            (userPrivileges, userRole) =>
              userPrivileges.concat(userRole.privileges),
            [] as string[],
          ),
        ),
      [] as string[],
    );
};

const getOrganizationPrivileges = (
  userPrivileges: UserPrivilegesResponse,
  organizationId: string,
): string[] => {
  return userPrivileges.organization_users
    .filter(
      (roleDefinition) =>
        roleDefinition.organization.organization_id === organizationId,
    )
    .reduce(
      (allPrivileges, orgsForId) =>
        allPrivileges.concat(
          orgsForId.organization_user_roles.reduce(
            (userPrivileges, userRole) =>
              userPrivileges.concat(userRole.privileges),
            [] as string[],
          ),
        ),
      [] as string[],
    );
};

export const getAgencyPrivileges = (
  userPrivileges: UserPrivilegesResponse,
  agencyId: string,
): string[] => {
  return userPrivileges.agency_users
    .filter((roleDefinition) => roleDefinition.agency.agency_id === agencyId)
    .reduce(
      (allPrivileges, orgsForId) =>
        allPrivileges.concat(
          orgsForId.agency_user_roles.reduce(
            (userPrivileges, userRole) =>
              userPrivileges.concat(userRole.privileges),
            [] as string[],
          ),
        ),
      [] as string[],
    );
};

const getUserPermissionsForResource = (
  requiredPrivilege: UserPrivilegeDefinition,
  userPrivileges: UserPrivilegesResponse,
): string[] => {
  if (requiredPrivilege.resourceType === "application") {
    return getApplicationPrivileges(
      userPrivileges,
      requiredPrivilege.resourceId || "",
    );
  }
  if (requiredPrivilege.resourceType === "organization") {
    return getOrganizationPrivileges(
      userPrivileges,
      requiredPrivilege.resourceId || "",
    );
  }
  if (requiredPrivilege.resourceType === "agency") {
    return getAgencyPrivileges(
      userPrivileges,
      requiredPrivilege.resourceId || "",
    );
  }
  console.error(
    `unknown resource type ${requiredPrivilege.resourceType as string}`,
  );
  return [];
};

export const checkPrivileges = (
  requiredPrivileges: UserPrivilegeDefinition[],
  userPrivileges: UserPrivilegesResponse,
): boolean => {
  return requiredPrivileges.some((requiredPrivilege) => {
    // get relevant user permissions for each required resource
    const userPermissionsForResource = getUserPermissionsForResource(
      requiredPrivilege,
      userPrivileges,
    );
    // user does not have any permissions for this resource
    if (!userPermissionsForResource || !userPermissionsForResource.length) {
      return null;
    }
    // does user have the necessary permission for this resource?
    return userPermissionsForResource.includes(requiredPrivilege.privilege);
  });
};
