import { RJSFSchema } from "@rjsf/utils";
import Ajv from "ajv";
import addFormats from "ajv-formats";

export const UiJsonSchema: RJSFSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    anyOf: [{ $ref: "#/$defs/field" }, { $ref: "#/$defs/section" }],
  },
  $defs: {
    field: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["field", "multiField"],
        },
        name: { type: "string" },
        schema: {
          $ref: "#/$defs/schema",
        },
        definition: {
          oneOf: [
            {
              type: "string",
              pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
            },
            {
              type: "array",
              items: {
                type: "string",
                pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
              },
            },
          ],
        },
        widget: {
          type: "string",
          enum: [
            "Checkbox",
            "Text",
            "TextArea",
            "Radio",
            "Select",
            "Attachment",
            "AttachmentArray",
            "Budget424a",
            "Budget424aSectionB",
            "Budget424aSectionA",
            "Budget424aTotalBudgetSummary",
          ],
        },
        attachmentType: { type: "string" },
      },
      required: ["type"],
      anyOf: [{ required: ["schema"] }, { required: ["definition"] }],
      additionalProperties: true,
    },
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: {
          type: "string",
          enum: ["boolean", "string", "number", "integer", "null"],
        },
        enum: { type: "array" },
        pattern: { type: "string", enum: ["date", "email"] },
      },
      required: ["title", "type"],
      additionalProperties: false, // or true, based on how strict you want it
    },
    section: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["section"] },
        label: { type: "string" },
        name: { type: "string" },
        children: {
          type: "array",
          items: {
            anyOf: [{ $ref: "#/$defs/field" }, { $ref: "#/$defs/section" }],
          },
        },
      },
      required: ["type", "label", "name", "children"],
      additionalProperties: true, // <- this was previously false, which broke validation
    },
  },
};

export const validateUiSchema = (data: object) => {
  return validateJsonBySchema(data, UiJsonSchema);
};

export const validateJsonBySchema = (json: object, schema: RJSFSchema) => {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const valid = validate(json);
  if (!valid) {
    return validate.errors;
  }
  return false;
};
