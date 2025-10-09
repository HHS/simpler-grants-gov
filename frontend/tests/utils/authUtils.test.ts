import { checkPrivileges, getAgencyPrivileges } from "src/utils/authUtils";
import { fakeUserPrivilegesResponse } from "src/utils/testing/fixtures";

describe("getAgencyPrivileges", () => {
  it("returns a flat array of agency privileges for a user", () => {
    expect(getAgencyPrivileges(fakeUserPrivilegesResponse, "3")).toEqual([
      "read_agency",
      "be_agency",
      "ingest_agency",
    ]);
  });
});

describe("checkPrivileges", () => {
  it("returns false if required permission is missing in user permissions", () => {
    expect(
      checkPrivileges(
        [
          {
            resourceId: "1",
            resourceType: "application",
            privilege: "modify_application",
          },
        ],
        fakeUserPrivilegesResponse,
      ),
    ).toEqual(false);
  });
  it("returns false if all required permissions are missing in user permissions", () => {
    expect(
      checkPrivileges(
        [
          {
            resourceId: "1",
            resourceType: "application",
            privilege: "modify_application",
          },
          {
            resourceId: "2",
            resourceType: "organization",
            privilege: "read_organization",
          },
        ],
        fakeUserPrivilegesResponse,
      ),
    ).toEqual(false);
  });
  it("returns true if all required permissions are present in user permissions", () => {
    expect(
      checkPrivileges(
        [
          {
            resourceId: "1",
            resourceType: "application",
            privilege: "read_application",
          },
          {
            resourceId: "1",
            resourceType: "organization",
            privilege: "read_organization",
          },
        ],
        fakeUserPrivilegesResponse,
      ),
    ).toEqual(true);
  });
  it("returns true if any one required permission matches", () => {
    expect(
      checkPrivileges(
        [
          {
            resourceId: "1",
            resourceType: "application",
            privilege: "read_application",
          },
          {
            resourceId: "2",
            resourceType: "organization",
            privilege: "read_organization",
          },
        ],
        fakeUserPrivilegesResponse,
      ),
    ).toEqual(true);
  });
});
