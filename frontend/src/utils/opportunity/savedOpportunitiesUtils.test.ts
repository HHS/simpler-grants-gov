import {
  DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  getScopeFromUrlParams,
} from "./savedOpportunitiiesUtils";

describe("getScopeFromUrlParams", () => {
  it("returns the correct path to an opportutnity detail page", () => {
    expect(getScopeFromUrlParams()).toEqual(DEFAULT_SAVED_OPPORTUNITY_SCOPE);
  });
});
