import { UserPrivilegeResult } from "src/types/userTypes";
import { hasConfirmedPrivilege } from "src/utils/hasConfirmedPrivilege";

const confirmedPrivilege = (
  overrides: Partial<UserPrivilegeResult> = {},
): UserPrivilegeResult => ({
  resourceId: "org-1",
  resourceType: "organization",
  privilege: "manage_org_members",
  authorized: true,
  ...overrides,
});

describe("hasConfirmedPrivilege", () => {
  it("returns true when the privilege is authorized for the resource", () => {
    expect(
      hasConfirmedPrivilege(
        [confirmedPrivilege()],
        "org-1",
        "manage_org_members",
      ),
    ).toBe(true);
  });

  it("returns false when the privilege is not authorized", () => {
    expect(
      hasConfirmedPrivilege(
        [confirmedPrivilege({ authorized: false })],
        "org-1",
        "manage_org_members",
      ),
    ).toBe(false);
  });

  it("returns false when the privilege is for another resource", () => {
    expect(
      hasConfirmedPrivilege(
        [confirmedPrivilege({ resourceId: "org-2" })],
        "org-1",
        "manage_org_members",
      ),
    ).toBe(false);
  });

  it("returns false when only a different privilege is authorized", () => {
    expect(
      hasConfirmedPrivilege(
        [confirmedPrivilege({ privilege: "view_org_membership" })],
        "org-1",
        "manage_org_members",
      ),
    ).toBe(false);
  });

  it("returns false when there are no confirmed privileges", () => {
    expect(hasConfirmedPrivilege([], "org-1", "manage_org_members")).toBe(
      false,
    );
  });
});
