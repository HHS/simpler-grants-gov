import { Privileges, UserPrivilegeResult } from "src/types/userTypes";

// Whether the privilege check for this resource passed
export function hasConfirmedPrivilege(
  confirmedPrivileges: UserPrivilegeResult[],
  resourceId: string,
  privilege: Privileges,
): boolean {
  return confirmedPrivileges.some(
    (confirmedPrivilege) =>
      confirmedPrivilege.resourceId === resourceId &&
      confirmedPrivilege.privilege === privilege &&
      confirmedPrivilege.authorized,
  );
}
