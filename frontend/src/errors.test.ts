import { BadRequestError } from "src/errors";
import { ParsedError } from "src/types/generalTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";

describe("BadRequestError (as an example of other error types)", () => {
  const dummySearchInputs: QueryParamData = {
    status: new Set(["active"]),
    fundingInstrument: new Set(["grant"]),
    eligibility: new Set(["public"]),
    agency: new Set(["NASA"]),
    assistanceListingNumber: new Set(["15.817"]),
    category: new Set(["science"]),
    closeDate: new Set(["500"]),
    costSharing: new Set(["true"]),
    topLevelAgency: new Set(["CDC"]),
    query: "space exploration",
    sortby: "relevancy",
    page: 1,
  };

  it("serializes search inputs and error message correctly", () => {
    const error = new BadRequestError("Test Error", {
      searchInputs: dummySearchInputs,
    });
    const { cause } = error as Error;
    const errorData = cause as ParsedError;

    expect(errorData.type).toEqual("BadRequestError");
    expect(errorData.status).toEqual(400);
    expect(errorData.message).toEqual("Test Error");
    expect(errorData.searchInputs?.status).toContain("active");
    expect(errorData.searchInputs?.fundingInstrument).toContain("grant");
  });

  it("handles non-Error inputs correctly", () => {
    const error = new BadRequestError("Some string error");
    const { message } = error as Error;
    expect(message).toEqual("Some string error");
  });

  it("sets a default message when error is not an instance of Error", () => {
    const error = new BadRequestError("");
    const { message } = error as Error;
    expect(message).toEqual("Unknown Error");
  });

  it("passes along additional error details", () => {
    const error = new BadRequestError("", {
      field: "fieldName",
      message: "a more detailed message",
      type: "a subtype",
    });
    const { cause } = error as Error;
    const errorData = cause as ParsedError;

    expect(errorData.details).toBeTruthy();
    expect(errorData.details?.field).toEqual("fieldName");
    expect(errorData.details?.message).toEqual("a more detailed message");
    expect(errorData.details?.type).toEqual("a subtype");
  });
});
