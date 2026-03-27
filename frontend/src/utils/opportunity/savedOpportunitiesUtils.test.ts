import {
  ALL_SAVED_OPPORTUNITY_SCOPE,
  DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  getSavedOpportunitiesScopeOrganizationIds,
  getScopeFromUrlParams,
  INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
} from "./savedOpportunitiiesUtils";

describe("getScopeFromUrlParams", () => {
  it("defaults to all saved opportunities scope", () => {
    expect(DEFAULT_SAVED_OPPORTUNITY_SCOPE).toEqual(
      ALL_SAVED_OPPORTUNITY_SCOPE,
    );
    expect(getScopeFromUrlParams()).toEqual(DEFAULT_SAVED_OPPORTUNITY_SCOPE);
  });

  it("returns the correct scope based on valid params", () => {
    const cases: Array<[string | undefined, string | undefined, object]> = [
      ["individual", undefined, { scope: "individual" }],
      ["all", undefined, { scope: "all" }],
      [undefined, "1", { scope: "organization", organizationIds: ["1"] }],
      ["organization", "1", { scope: "organization", organizationIds: ["1"] }],
    ];

    cases.forEach(([scope, orgId, expected]) => {
      expect(getScopeFromUrlParams(scope, orgId)).toEqual(expected);
    });
  });

  it("falls back to the default scope if invalid params", () => {
    ["notascope", "organization"].forEach((scope) => {
      expect(getScopeFromUrlParams(scope)).toEqual(
        DEFAULT_SAVED_OPPORTUNITY_SCOPE,
      );
    });
  });
});

describe("getSavedOpportunitiesScopeOrganizationIds", () => {
  it("should return the appropriate organization_ids.one_of API filter value", () => {
    expect(
      getSavedOpportunitiesScopeOrganizationIds(
        INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
      ),
    ).toEqual([]);
    expect(
      getSavedOpportunitiesScopeOrganizationIds(ALL_SAVED_OPPORTUNITY_SCOPE),
    ).toEqual(null);
    expect(
      getSavedOpportunitiesScopeOrganizationIds({
        scope: "organization",
        organizationIds: ["1"],
      }),
    ).toEqual(["1"]);
  });
});
