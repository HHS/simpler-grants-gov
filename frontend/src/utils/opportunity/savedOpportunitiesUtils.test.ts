import {
  ALL_SAVED_OPPORTUNITY_SCOPE,
  DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  getSavedOpportunitiesScopeOrganizationIds,
  getScopeFromUrlParams,
  INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
} from "./savedOpportunitiesUtils";

describe("getScopeFromUrlParams", () => {
  it("defaults to all saved opportunities scope", () => {
    expect(DEFAULT_SAVED_OPPORTUNITY_SCOPE).toEqual(
      ALL_SAVED_OPPORTUNITY_SCOPE,
    );
    expect(getScopeFromUrlParams()).toEqual(DEFAULT_SAVED_OPPORTUNITY_SCOPE);
  });

  it("returns the correct scope based on valid legacy params", () => {
    const cases: Array<[string | undefined, string | undefined, object]> = [
      ["individual", undefined, { scope: "individual" }],
      ["all", undefined, { scope: "all" }],
      [undefined, "1", { scope: "organization", organizationIds: ["1"] }],
      ["organization", "1", { scope: "organization", organizationIds: ["1"] }],
    ];

    cases.forEach(([scope, organizationId, expected]) => {
      expect(getScopeFromUrlParams(scope, organizationId)).toEqual(expected);
    });
  });

  it("returns the correct scope based on savedBy", () => {
    expect(getScopeFromUrlParams(undefined, undefined, "all")).toEqual(
      DEFAULT_SAVED_OPPORTUNITY_SCOPE,
    );

    expect(getScopeFromUrlParams(undefined, undefined, "individual")).toEqual(
      INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
    );

    expect(
      getScopeFromUrlParams(undefined, undefined, "organization:1"),
    ).toEqual({
      scope: "organization",
      organizationIds: ["1"],
    });
  });

  it("gives savedBy precedence over legacy params", () => {
    expect(getScopeFromUrlParams("all", undefined, "individual")).toEqual(
      INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
    );

    expect(
      getScopeFromUrlParams("individual", undefined, "organization:1"),
    ).toEqual({
      scope: "organization",
      organizationIds: ["1"],
    });
  });

  it("falls back to the default scope if invalid params", () => {
    ["notascope", "organization"].forEach((scope) => {
      expect(getScopeFromUrlParams(scope)).toEqual(
        DEFAULT_SAVED_OPPORTUNITY_SCOPE,
      );
    });

    expect(
      getScopeFromUrlParams(undefined, undefined, "not-a-real-filter"),
    ).toEqual(DEFAULT_SAVED_OPPORTUNITY_SCOPE);
  });
});

describe("getSavedOpportunitiesScopeOrganizationIds", () => {
  it("returns the appropriate organization_ids.one_of API filter value", () => {
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
