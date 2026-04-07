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

// calls the API to check all required privileges,
// and formats results into a format to be used downstream
// note that if a non-403 is returned, that error will be passed along
// since we'll consider a non-403 as unauthorized, children should check for errors
// first before checking "authorized"
export const checkRequiredPrivileges = async (
  token: string,
  userId: string,
  privileges: UserPrivilegeRequest[],
): Promise<UserPrivilegeResult[]> => {
  const privilegeCheckResults = await Promise.all(
    privileges.map((privilege) => {
      return checkUserPrivilege(token, userId, privilege)
        .then(() => {
          return { ...privilege, authorized: true };
        })
        .catch((e: Error) => {
          if (parseErrorStatus(e) === 403) {
            return { ...privilege, authorized: false };
          }
          return { ...privilege, authorized: false, error: e.message };
        });
    }),
  );
  return privilegeCheckResults;
};
