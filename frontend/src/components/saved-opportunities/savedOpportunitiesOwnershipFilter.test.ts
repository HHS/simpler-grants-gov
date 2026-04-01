import {
  getOrganizationIdsFilter,
  getOwnershipFilterValue,
  parseOwnershipFilterValue,
} from "./savedOpportunitiesOwnershipFilter";

describe("savedOpportunitiesOwnershipFilter", () => {
  it("parses null as all", () => {
    expect(parseOwnershipFilterValue(null)).toEqual({ kind: "all" });
  });

  it("parses individual", () => {
    expect(parseOwnershipFilterValue("individual")).toEqual({
      kind: "individual",
    });
  });

  it("parses organization values", () => {
    expect(parseOwnershipFilterValue("organization:org-1")).toEqual({
      kind: "organization",
      organizationId: "org-1",
    });
  });

  it("serializes all", () => {
    expect(getOwnershipFilterValue({ kind: "all" })).toBe("all");
  });

  it("serializes individual", () => {
    expect(getOwnershipFilterValue({ kind: "individual" })).toBe("individual");
  });

  it("serializes organization", () => {
    expect(
      getOwnershipFilterValue({
        kind: "organization",
        organizationId: "org-1",
      }),
    ).toBe("organization:org-1");
  });

  it("maps all to null", () => {
    expect(getOrganizationIdsFilter({ kind: "all" })).toBeNull();
  });

  it("maps individual to an empty array", () => {
    expect(getOrganizationIdsFilter({ kind: "individual" })).toEqual([]);
  });

  it("maps organization to a single-item array", () => {
    expect(
      getOrganizationIdsFilter({
        kind: "organization",
        organizationId: "org-1",
      }),
    ).toEqual(["org-1"]);
  });
});
