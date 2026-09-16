import { mapApiValidationErrors } from "./validationUtils";

const fakeValidFields = ["name", "other_name"];
const fakeGenericMessage = "an error message";

describe("mapApiValidationRules", () => {
  it("returns undefined message and errors if there are no errors", () => {
    expect(
      mapApiValidationErrors({}, fakeGenericMessage, fakeValidFields),
    ).toEqual({ validationErrors: undefined, errorMessage: undefined });
  });
  it("returns properly mapped validation messages when present", () => {
    expect(
      mapApiValidationErrors(
        {
          errors: [
            { field: "name", message: "error one" },
            { field: "name", message: "error two" },
            { field: "other_name", message: "error three" },
          ],
        },
        fakeGenericMessage,
        fakeValidFields,
      ),
    ).toEqual({
      validationErrors: {
        name: ["error one", "error two"],
        other_name: ["error three"],
      },
      errorMessage: undefined,
    });
  });
  it("returns generic message when validation message not provided", () => {
    expect(
      mapApiValidationErrors(
        {
          errors: [
            { field: "name" },
            { field: "name", message: "error two" },
            { field: "other_name", message: "error three" },
          ],
        },
        fakeGenericMessage,
        fakeValidFields,
      ),
    ).toEqual({
      validationErrors: {
        name: ["an error message", "error two"],
        other_name: ["error three"],
      },
      errorMessage: undefined,
    });
  });
  it("returns unmapped warnings in message when present", () => {
    expect(
      mapApiValidationErrors(
        {
          errors: [
            { field: "not_name", message: "error one" },
            { field: "not_name", message: "error two" },
            { field: "other_name", message: "error three" },
          ],
        },
        fakeGenericMessage,
        fakeValidFields,
      ),
    ).toEqual({
      validationErrors: {
        other_name: ["error three"],
      },
      errorMessage: "error one error two",
    });
  });
  it("returns top level messsage when other warnings are not when present", () => {
    expect(
      mapApiValidationErrors(
        {
          message: "something",
        },
        fakeGenericMessage,
        fakeValidFields,
      ),
    ).toEqual({
      validationErrors: undefined,
      errorMessage: "something",
    });
  });
});
