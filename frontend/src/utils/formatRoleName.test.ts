import type { UserRole } from "src/types/userTypes";
import { formatRoleNames } from "src/utils/formatRoleName";

const role = (name: string): UserRole =>
  ({ role_name: name, role_id: "test-id", privileges: [] }) as UserRole;

describe("formatRoleNames", () => {
  it("returns empty string when roles is undefined", () => {
    expect(formatRoleNames(undefined)).toBe("");
  });

  it("returns empty string when roles is an empty array", () => {
    expect(formatRoleNames([])).toBe("");
  });

  it("formats a single role", () => {
    expect(formatRoleNames([role("Admin")])).toBe("Admin");
  });

  it("formats multiple roles separated by comma and space", () => {
    expect(formatRoleNames([role("Admin"), role("Editor"), role("Viewer")])).toBe(
      "Admin, Editor, Viewer"
    );
  });

  it("formats two roles", () => {
    expect(formatRoleNames([role("Admin"), role("User")])).toBe("Admin, User");
  });
});
