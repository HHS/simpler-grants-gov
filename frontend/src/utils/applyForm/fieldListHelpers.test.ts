import { FormattedFormValidationWarning } from "src/types/applyForm/types";

import {
  getFieldListChildErrors,
  getFieldListGroupErrors,
} from "./fieldListHelpers";

describe("fieldListHelpers", () => {
  describe("getFieldListGroupErrors", () => {
    it("returns an empty array when rawErrors is undefined", () => {
      expect(
        getFieldListGroupErrors({
          rawErrors: undefined,
          fieldListPath: "$.contact_people_test",
        }),
      ).toEqual([]);
    });

    it("returns only group-level warnings for the matching FieldList path", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test",
          message: "At least one contact is required",
          type: "minItems",
          value: null,
        },
        {
          field: "$.contact_people_test",
          message: "First Name is required",
          type: "required",
          value: null,
          definition:
            "/properties/contact_people_test/items/properties/first_name",
        },
        {
          field: "$.different_field_list",
          message: "At least one entry is required",
          type: "minItems",
          value: null,
        },
      ];

      expect(
        getFieldListGroupErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
        }),
      ).toEqual([
        {
          field: "$.contact_people_test",
          message: "At least one contact is required",
          type: "minItems",
          value: null,
        },
      ]);
    });

    it("deduplicates duplicate group-level warnings", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test",
          message: "At least one contact is required",
          type: "minItems",
          value: null,
        },
        {
          field: "$.contact_people_test",
          message: "At least one contact is required",
          type: "minItems",
          value: null,
        },
      ];

      expect(
        getFieldListGroupErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
        }),
      ).toEqual([
        {
          field: "$.contact_people_test",
          message: "At least one contact is required",
          type: "minItems",
          value: null,
        },
      ]);
    });
  });

  describe("getFieldListChildErrors", () => {
    const childDefinition =
      "/properties/contact_people_test/items/properties/first_name";

    it("returns an empty array when rawErrors is undefined", () => {
      expect(
        getFieldListChildErrors({
          rawErrors: undefined,
          fieldListPath: "$.contact_people_test",
          entryIndex: 1,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual([]);
    });

    it("returns the row-aware warning for the matching row only", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test[1].first_name",
          message: "'first_name' is a required property",
          formatted: "First Name is required",
          type: "required",
          value: null,
          definition: childDefinition,
        },
      ];

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 1,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual(["First Name is required"]);

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 0,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual([]);
    });

    it("does not leak indexed warnings across rows", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test[2].first_name",
          message: "'first_name' is a required property",
          formatted: "First Name is required",
          type: "required",
          value: null,
          definition: childDefinition,
        },
      ];

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 1,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual([]);
    });

    it("falls back to definition matching when the warning is not row-aware", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test",
          message: "[] should be non-empty",
          formatted: "First Name is required",
          type: "minItems",
          value: null,
          definition: childDefinition,
        },
      ];

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 0,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual(["First Name is required"]);
    });

    it("deduplicates duplicate child messages", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test[1].first_name",
          message: "'first_name' is a required property",
          formatted: "First Name is required",
          type: "required",
          value: null,
          definition: childDefinition,
        },
        {
          field: "$.contact_people_test[1].first_name",
          message: "'first_name' is a required property",
          formatted: "First Name is required",
          type: "required",
          value: null,
          definition: childDefinition,
        },
      ];

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 1,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual(["First Name is required"]);
    });

    it("uses message when formatted is missing", () => {
      const rawErrors: FormattedFormValidationWarning[] = [
        {
          field: "$.contact_people_test[1].first_name",
          message: "'first_name' is a required property",
          type: "required",
          value: null,
          definition: childDefinition,
        },
      ];

      expect(
        getFieldListChildErrors({
          rawErrors,
          fieldListPath: "$.contact_people_test",
          entryIndex: 1,
          storageKey: "first_name",
          childDefinition,
        }),
      ).toEqual(["'first_name' is a required property"]);
    });
  });
});
