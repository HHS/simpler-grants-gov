import { UserRole } from "src/types/userTypes";

export function formatRoleNames(roles?: UserRole[]): string {
  if (!roles || roles.length === 0) {
    return "";
  }

  return roles.map((role) => role.role_name).join(", ");
}
