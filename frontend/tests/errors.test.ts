import { ApiResponseError, BadRequestError } from "src/errors";
import { QueryParamData } from "src/types/search/searchRequestTypes";

describe("BadRequestError (as an example of other error types)", () => {
  const dummySearchInputs: QueryParamData = {
    status: new Set(["active"]),
    fundingInstrument: new Set(["grant"]),
    eligibility: new Set(["public"]),
    agency: new Set(["NASA"]),
    category: new Set(["science"]),
    query: "space exploration",
    sortby: "relevancy",
    page: 1,
  };

  it("serializes search inputs and error message correctly", () => {
    const error = new BadRequestError("Test Error", {
      searchInputs: dummySearchInputs,
    });
    const { cause } = error as Error;
    const errorData = JSON.parse(cause as string) as ApiResponseError;

    expect(errorData.type).toEqual("BadRequestError");
    expect(errorData.status).toEqual(400);
    expect(errorData.message).toEqual("Test Error");
    expect(errorData.searchInputs.status).toContain("active");
    expect(errorData.searchInputs.fundingInstrument).toContain("grant");
  });

  it("handles non-Error inputs correctly", () => {
    const error = new BadRequestError("Some string error");
    const { cause } = error as Error;
    const errorData = JSON.parse(cause as string) as ApiResponseError;

    expect(errorData.message).toEqual("Some string error");
  });

  it("sets a default message when error is not an instance of Error", () => {
    const error = new BadRequestError("");
    const { cause } = error as Error;
    const errorData = JSON.parse(cause as string) as ApiResponseError;

    expect(errorData.message).toEqual("Unknown Error");
  });

  it("passes along additional error details", () => {
    const error = new BadRequestError("", {
      field: "fieldName",
      message: "a more detailed message",
      type: "a subtype",
    });
    const { cause } = error as Error;
    const errorData = JSON.parse(cause as string) as ApiResponseError;

    expect(errorData.details?.field).toEqual("fieldName");
    expect(errorData.details?.message).toEqual("a more detailed message");
    expect(errorData.details?.type).toEqual("a subtype");
  });
});
