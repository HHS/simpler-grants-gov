import { parseErrorStatus } from "src/errors";
import { checkUserPrivilege } from "src/services/fetch/fetchers/userFetcher";

export type GatedResourceTypes = "application" | "organization" | "agency";

export type Privileges =
  | "view_opportunity"
  | "update_opportunity"
  | "create_opportunity";

export interface UserPrivilegeRequest {
  resourceId?: string;
  resourceType: GatedResourceTypes;
  privilege: Privileges;
}

export interface UserPrivilegeResult extends UserPrivilegeRequest {
  authorized: boolean;
  error?: string;
}

// Check the user's privileges
export const checkUserRequiredPrivileges = async (
  userId: string,
  privileges: UserPrivilegeRequest[],
): Promise<UserPrivilegeResult[]> => {
  const privilegeCheckResults = await Promise.all(
    privileges.map((privilege) => {
      return checkUserPrivilege(userId, privilege)
        .then(() => {
          return { ...privilege, authorized: true };
        })
        .catch((e: Error) => {
          if (parseErrorStatus(e) === 403) {
            return { ...privilege, authorized: false };
          }
          throw e;
        });
    }),
  );
  return privilegeCheckResults;
};
