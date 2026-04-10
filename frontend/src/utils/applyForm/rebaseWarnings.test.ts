import { FormattedFormValidationWarning } from "src/types/applyForm/types";

import { rebaseFieldListWarningsAfterDelete } from "./rebaseWarnings";

describe("rebaseFieldListWarningsAfterDelete", () => {
  it("returns undefined when rawErrors is undefined", () => {
    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors: undefined,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 0,
      }),
    ).toBeUndefined();
  });

  it("returns the warnings unchanged when there are no row-aware warnings", () => {
    const rawErrors: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test",
        message: "[] should be non-empty",
        type: "minItems",
        value: null,
        definition:
          "/properties/contact_people_test/items/properties/first_name",
      },
    ];

    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 0,
      }),
    ).toEqual(rawErrors);
  });

  it("removes warnings for the deleted entry", () => {
    const rawErrors: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test[1].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[1]--first_name",
      },
    ];

    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 1,
      }),
    ).toEqual([]);
  });

  it("leaves warnings for earlier entries unchanged", () => {
    const rawErrors: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test[0].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[0]--first_name",
      },
    ];

    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 1,
      }),
    ).toEqual(rawErrors);
  });

  it("shifts later entry warnings down by one and updates htmlField", () => {
    const rawErrors: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test[2].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[2]--first_name",
      },
    ];

    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 1,
      }),
    ).toEqual([
      {
        field: "$.contact_people_test[1].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[1]--first_name",
      },
    ]);
  });

  it("handles multiple warnings in one pass", () => {
    const rawErrors: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test[0].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[0]--first_name",
      },
      {
        field: "$.contact_people_test[2].email",
        message: "'email' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[2]--email",
      },
    ];

    expect(
      rebaseFieldListWarningsAfterDelete({
        rawErrors,
        fieldListPath: "$.contact_people_test",
        deletedEntryIndex: 1,
      }),
    ).toEqual([
      {
        field: "$.contact_people_test[0].first_name",
        message: "'first_name' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[0]--first_name",
      },
      {
        field: "$.contact_people_test[1].email",
        message: "'email' is a required property",
        type: "required",
        value: null,
        htmlField: "contact_people_test[1]--email",
      },
    ]);
  });
});
