import { ParsedError } from "src/app/[locale]/search/error";
import { BadRequestError } from "src/errors";

describe("BadRequestError (as an example of other error types)", () => {

  it("serializes error message correctly", () => {
    const error = new BadRequestError("Test Error");
    const { cause } = error as Error;
    const errorData = cause as ParsedError;

    expect(errorData.type).toEqual("BadRequestError");
    expect(errorData.status).toEqual(400);
    expect(errorData.message).toEqual("Test Error");
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

    expect(errorData.details?.field).toEqual("fieldName");
    expect(errorData.details?.message).toEqual("a more detailed message");
    expect(errorData.details?.type).toEqual("a subtype");
  });
});
