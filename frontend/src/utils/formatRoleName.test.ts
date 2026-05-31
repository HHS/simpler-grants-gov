import type { UserRole } from "src/types/userTypes";
import { formatRoleNames } from "src/utils/formatRoleName";

const role = (name: string): UserRole => ({ role_name: name } as UserRole);

describe("formatRoleNames", () => {
  it("returns empty string when roles is undefined", () => {
    expect(formatRoleNames(undefined)).toBe("");
  });

  it("returns empty string when roles is empty array", () => {
    expect(formatRoleNames([])).toBe("");
  });

  it("returns the role_name when roles has one entry", () => {
    expect(formatRoleNames([role("Admin")])).toBe("Admin");
  });

  it("joins role_names with a comma and space", () => {
    expect(formatRoleNames([role("Admin"), role("Editor")])).toBe(
      "Admin, Editor",
    );
  });
});
