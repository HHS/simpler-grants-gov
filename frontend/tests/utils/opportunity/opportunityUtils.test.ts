import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

describe("getOpportunityUrl", () => {
  it("returns the correct path to an opportutnity detail page", () => {
    expect(getOpportunityUrl(1)).toEqual("/opportunity/1");
  });
});
