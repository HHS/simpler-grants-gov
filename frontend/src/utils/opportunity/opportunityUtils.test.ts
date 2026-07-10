import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

describe("getOpportunityUrl", () => {
  it("returns the correct path to an opportutnity detail page", () => {
    expect(getOpportunityUrl("63588df8-f2d1-44ed-a201-5804abba696a")).toEqual(
      "/opportunity/63588df8-f2d1-44ed-a201-5804abba696a",
    );
  });
});
