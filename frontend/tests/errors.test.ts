import { BadRequestError } from "src/errors";
import { ParsedError } from "src/app/[locale]/search/error";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";

describe("BadRequestError", () => {
  const dummySearchInputs: QueryParamData = {
    status: new Set(["active"]),
    fundingInstrument: new Set(["grant"]),
    eligibility: new Set(["public"]),
    agency: new Set(["NASA"]),
    category: new Set(["science"]),
    query: "space exploration",
    sortby: "date",
    page: 1,
  };

  it("serializes search inputs and error message correctly", () => {
    const error = new BadRequestError(
      new Error("Test Error"),
      dummySearchInputs,
    );
    const errorData = JSON.parse(error.message) as ParsedError;

    expect(errorData.type).toEqual("BadRequestError");
    expect(errorData.status).toEqual(400);
    expect(errorData.message).toEqual("Test Error");
    expect(errorData.searchInputs.status).toContain("active");
    expect(errorData.searchInputs.fundingInstrument).toContain("grant");
  });

  it("handles non-Error inputs correctly", () => {
    const error = new BadRequestError("Some string error", dummySearchInputs);
    const errorData = JSON.parse(error.message) as ParsedError;

    expect(errorData.message).toEqual("Unknown Error");
  });

  it("sets a default message when error is not an instance of Error", () => {
    const error = new BadRequestError(null, dummySearchInputs);
    const errorData = JSON.parse(error.message) as ParsedError;

    expect(errorData.message).toEqual("Unknown Error");
  });
});
