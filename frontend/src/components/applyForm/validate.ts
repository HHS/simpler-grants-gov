import { RJSFSchema } from "@rjsf/utils";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// JSON Schema for the UiSchema, accepts either a "field" or "section"
export const UiJsonSchema: RJSFSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    anyOf: [
      {
        $ref: "#/$defs/field",
      },
      {
        $ref: "#/$defs/section",
      },
    ],
  },
  $defs: {
    field: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["field", "multiField", "null"],
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
            "Attachment",
            "AttachmentArray",
            "Checkbox",
            "Text",
            "TextArea",
            "Radio",
            "Select",
            "MultiSelect",
            "Budget424a",
            "Budget424aSectionA",
            "Budget424aSectionB",
            "Budget424aSectionC",
            "Budget424aSectionD",
            "Budget424aSectionE",
            "Budget424aSectionF",
            "Budget424aTotalBudgetSummary",
          ],
        },
        attachmentType: { type: "string" },
      },
      required: ["type"],
      anyOf: [
        {
          required: ["schema"],
        },
        {
          required: ["definition"],
        },
      ],
      additionalProperties: false,
    },
    schema: {
      type: "object",
      properties: {
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["boolean", "string", "number", "integer", "null"],
            },
            enum: {
              type: "array",
            },
            pattern: {
              type: "string",
              enum: ["date", "email"],
            },
          },
          required: ["title", "type"],
          additionalProperties: false,
        },
      },
    },
    section: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["section"],
        },
        label: {
          type: "string",
        },
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        children: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/field",
              },
              {
                $ref: "#/$defs/section",
              },
            ],
          },
        },
      },
      required: ["type", "label", "name", "children"],
      additionalProperties: false,
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

  if (validate(json)) {
    return false;
  } else {
    return validate.errors;
  }
};
