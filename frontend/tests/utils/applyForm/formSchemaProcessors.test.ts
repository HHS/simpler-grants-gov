import { omit } from "lodash";
import { extricateConditionalValidationRules } from "src/utils/applyForm/formSchemaProcessors";

const simpleProperties = {
  funding_opportunity_number: {
    type: "string",
    title: "Funding Opportunity Number",
    minLength: 1,
    maxLength: 40,
  },
  assistance_listing_number: {
    type: "string",
    title: "Assistance Listing Number",
    minLength: 1,
    maxLength: 15,
  },
  applicant_name: {
    allOf: [
      {
        type: "string",
        title: "Organization Name",
        minLength: 1,
        maxLength: 60,
      },
    ],
    title: "Applicant Name",
    description:
      "This should match the 'Legal Name' field from the SF-424 form",
  },
  project_title: {
    type: "string",
    title: "Descriptive Title of Applicant's Project",
    description:
      "This should match the 'Project Title' field from the SF-424 form",
    minLength: 1,
    maxLength: 250,
  },
  project_abstract: {
    type: "string",
    title: "Project Abstract",
    minLength: 1,
    maxLength: 4000,
  },
};

const withIfThenAllOf = {
  ...simpleProperties,
  application_info: {
    type: "object",
    allOf: [
      {
        if: {
          properties: { additional_funding: { const: true } },
          required: ["additional_funding"],
        },
        then: { required: ["additional_funding_explanation"] },
      },
      {
        if: {
          properties: { application_type: { const: "Supplement" } },
          required: ["application_type"],
        },
        then: { required: ["supplemental_grant_numbers"] },
      },
    ],
    properties: {
      additional_funding: {
        type: "boolean",
        title: "Additional Funding",
        description:
          "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
      },
      additional_funding_explanation: {
        type: "string",
        title: "Additional Funding Explanation",
        description: "If yes, please explain where and when:",
        minLength: 1,
        maxLength: 50,
      },
      application_type: {
        type: "string",
        enum: ["New", "Supplement"],
        title: "Type of Application",
      },
      supplemental_grant_numbers: {
        type: "string",
        title: "Supplemental Grant Numbers",
        description: "if supplement, list current grant number(s)",
        minLength: 1,
        maxLength: 50,
      },
    },
  },
};

const withNestedIfThenAllOf = {
  person_name: {
    type: "object",
    title: "Name and Contact Information",
    description: "",
    required: ["first_name", "last_name"],
    properties: {
      application_info: {
        type: "object",
        allOf: [
          {
            if: {
              properties: { additional_funding: { const: true } },
              required: ["additional_funding"],
            },
            then: { required: ["additional_funding_explanation"] },
          },
          {
            if: {
              properties: { application_type: { const: "Supplement" } },
              required: ["application_type"],
            },
            then: { required: ["supplemental_grant_numbers"] },
          },
        ],
        properties: {
          additional_funding: {
            type: "boolean",
            title: "Additional Funding",
            description:
              "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
          },
          additional_funding_explanation: {
            type: "string",
            title: "Additional Funding Explanation",
            description: "If yes, please explain where and when:",
            minLength: 1,
            maxLength: 50,
          },
          application_type: {
            type: "string",
            enum: ["New", "Supplement"],
            title: "Type of Application",
          },
          supplemental_grant_numbers: {
            type: "string",
            title: "Supplemental Grant Numbers",
            description: "if supplement, list current grant number(s)",
            minLength: 1,
            maxLength: 50,
          },
        },
      },
    },
  },
};

const withAllOfInArray = {
  property_with_reference: {
    allOf: [
      {
        type: "object",
        allOf: [
          {
            if: {
              properties: { additional_funding: { const: true } },
              required: ["additional_funding"],
            },
            then: { required: ["additional_funding_explanation"] },
          },
          {
            if: {
              properties: { application_type: { const: "Supplement" } },
              required: ["application_type"],
            },
            then: { required: ["supplemental_grant_numbers"] },
          },
        ],
        properties: {
          additional_funding: {
            type: "boolean",
            title: "Additional Funding",
            description:
              "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
          },
          additional_funding_explanation: {
            type: "string",
            title: "Additional Funding Explanation",
            description: "If yes, please explain where and when:",
            minLength: 1,
            maxLength: 50,
          },
          application_type: {
            type: "string",
            enum: ["New", "Supplement"],
            title: "Type of Application",
          },
          supplemental_grant_numbers: {
            type: "string",
            title: "Supplemental Grant Numbers",
            description: "if supplement, list current grant number(s)",
            minLength: 1,
            maxLength: 50,
          },
        },
      },
    ],
  },
};

const complexGuy = {
  another_array_with_a_nested_allof: {
    allOf: [
      {
        type: "object",
        allOf: [
          {
            if: {
              properties: { bad_funding: { const: true } },
              required: ["bad_funding"],
            },
            then: { required: ["bad_funding_explanation"] },
          },
          {
            if: {
              properties: { fun_ding_type: { const: "Supplement" } },
              required: ["fun_ding_type"],
            },
            then: { required: ["fun_ding_numbers"] },
          },
        ],
        properties: {
          bad_funding: {
            type: "boolean",
            title: "Additional Funding",
            description:
              "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
          },
          bad_funding_explanation: {
            type: "string",
            title: "Additional Funding Explanation",
            description: "If yes, please explain where and when:",
            minLength: 1,
            maxLength: 50,
          },
          fun_ding_type: {
            type: "string",
            enum: ["New", "Supplement"],
            title: "Type of Application",
          },
          fun_ding_numbers: {
            type: "string",
            title: "Supplemental Grant Numbers",
            description: "if supplement, list current grant number(s)",
            minLength: 1,
            maxLength: 50,
          },
        },
      },
    ],
  },
  second_nested_allOf: {
    type: "object",
    allOf: [
      {
        if: {
          properties: { some_property: { const: true } },
          required: ["some_property"],
        },
        then: { required: ["some_property_explanation"] },
      },
      {
        if: {
          properties: { type_of_second_thing: { const: "Supplement" } },
          required: ["type_of_second_thing"],
        },
        then: { required: ["random_numbers"] },
      },
    ],
    properties: {
      some_property: {
        type: "boolean",
        title: "Additional Funding",
        description:
          "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
      },
      some_property_explanation: {
        type: "string",
        title: "Additional Funding Explanation",
        description: "If yes, please explain where and when:",
        minLength: 1,
        maxLength: 50,
      },
      type_of_second_thing: {
        type: "string",
        enum: ["New", "Supplement"],
        title: "Type of Application",
      },
      random_numbers: {
        type: "string",
        title: "Supplemental Grant Numbers",
        description: "if supplement, list current grant number(s)",
        minLength: 1,
        maxLength: 50,
      },
    },
  },
};

describe("extricateConditionalValidationRules", () => {
  it("errors if schema contains malformed allOfs", () => {
    expect(() =>
      extricateConditionalValidationRules({
        ...simpleProperties,
        allOf: {
          if: {
            properties: { additional_funding: { const: true } },
            required: ["additional_funding"],
          },
          then: { required: ["additional_funding_explanation"] },
        },
      }),
    ).toThrow();
  });
  it("returns no validation rules and unchanged property set for a simple schema", () => {
    expect(extricateConditionalValidationRules(simpleProperties)).toEqual({
      propertiesWithoutComplexConditionals: simpleProperties,
      conditionalValidationRules: {},
    });
  });
  it("handles removing and returning complex validation rules", () => {
    expect(extricateConditionalValidationRules(withIfThenAllOf)).toEqual({
      propertiesWithoutComplexConditionals: {
        ...withIfThenAllOf,
        application_info: omit(withIfThenAllOf.application_info, "allOf"),
      },
      conditionalValidationRules: {
        application_info: [
          {
            if: {
              properties: { additional_funding: { const: true } },
              required: ["additional_funding"],
            },
            then: { required: ["additional_funding_explanation"] },
          },
          {
            if: {
              properties: { application_type: { const: "Supplement" } },
              required: ["application_type"],
            },
            then: { required: ["supplemental_grant_numbers"] },
          },
        ],
      },
    });
  });
  it("handles removing and returning nested complex validation rules", () => {
    expect(extricateConditionalValidationRules(withNestedIfThenAllOf)).toEqual({
      propertiesWithoutComplexConditionals: {
        ...withNestedIfThenAllOf,
        person_name: {
          ...withNestedIfThenAllOf.person_name,
          properties: {
            ...withNestedIfThenAllOf.person_name.properties,
            application_info: omit(
              withNestedIfThenAllOf.person_name.properties.application_info,
              "allOf",
            ),
          },
        },
      },
      conditionalValidationRules: {
        "person_name/properties/application_info": [
          {
            if: {
              properties: { additional_funding: { const: true } },
              required: ["additional_funding"],
            },
            then: { required: ["additional_funding_explanation"] },
          },
          {
            if: {
              properties: { application_type: { const: "Supplement" } },
              required: ["application_type"],
            },
            then: { required: ["supplemental_grant_numbers"] },
          },
        ],
      },
    });
  });
  it("handles removing and returning complex validation rules nested in arrays", () => {
    const result = extricateConditionalValidationRules(withAllOfInArray);
    expect(result.propertiesWithoutComplexConditionals).toEqual({
      property_with_reference: {
        allOf: [
          omit(withAllOfInArray.property_with_reference.allOf[0], "allOf"),
        ],
      },
    });
    expect(result.conditionalValidationRules).toEqual({
      "property_with_reference/allOf[0]": [
        {
          if: {
            properties: { additional_funding: { const: true } },
            required: ["additional_funding"],
          },
          then: { required: ["additional_funding_explanation"] },
        },
        {
          if: {
            properties: { application_type: { const: "Supplement" } },
            required: ["application_type"],
          },
          then: { required: ["supplemental_grant_numbers"] },
        },
      ],
    });
  });
  it("handles multiple instances of if/then allOfs throughout a schema", () => {
    const result = extricateConditionalValidationRules({
      ...simpleProperties,
      ...withNestedIfThenAllOf,
      ...withAllOfInArray,
      ...withIfThenAllOf,
      ...complexGuy,
    });
    expect(result.propertiesWithoutComplexConditionals).toEqual({
      ...simpleProperties,
      application_info: omit(withIfThenAllOf.application_info, "allOf"),
      person_name: {
        ...withNestedIfThenAllOf.person_name,
        properties: {
          ...withNestedIfThenAllOf.person_name.properties,
          application_info: omit(
            withNestedIfThenAllOf.person_name.properties.application_info,
            "allOf",
          ),
        },
      },
      property_with_reference: {
        allOf: [
          omit(withAllOfInArray.property_with_reference.allOf[0], "allOf"),
        ],
      },
      another_array_with_a_nested_allof: {
        allOf: [
          omit(complexGuy.another_array_with_a_nested_allof.allOf[0], "allOf"),
        ],
      },
      second_nested_allOf: omit(complexGuy.second_nested_allOf, "allOf"),
    });
    expect(result.conditionalValidationRules).toEqual({
      application_info: [
        {
          if: {
            properties: { additional_funding: { const: true } },
            required: ["additional_funding"],
          },
          then: { required: ["additional_funding_explanation"] },
        },
        {
          if: {
            properties: { application_type: { const: "Supplement" } },
            required: ["application_type"],
          },
          then: { required: ["supplemental_grant_numbers"] },
        },
      ],
      "person_name/properties/application_info": [
        {
          if: {
            properties: { additional_funding: { const: true } },
            required: ["additional_funding"],
          },
          then: { required: ["additional_funding_explanation"] },
        },
        {
          if: {
            properties: { application_type: { const: "Supplement" } },
            required: ["application_type"],
          },
          then: { required: ["supplemental_grant_numbers"] },
        },
      ],
      "property_with_reference/allOf[0]": [
        {
          if: {
            properties: { additional_funding: { const: true } },
            required: ["additional_funding"],
          },
          then: { required: ["additional_funding_explanation"] },
        },
        {
          if: {
            properties: { application_type: { const: "Supplement" } },
            required: ["application_type"],
          },
          then: { required: ["supplemental_grant_numbers"] },
        },
      ],
      second_nested_allOf: [
        {
          if: {
            properties: { some_property: { const: true } },
            required: ["some_property"],
          },
          then: { required: ["some_property_explanation"] },
        },
        {
          if: {
            properties: { type_of_second_thing: { const: "Supplement" } },
            required: ["type_of_second_thing"],
          },
          then: { required: ["random_numbers"] },
        },
      ],
      "another_array_with_a_nested_allof/allOf[0]": [
        {
          if: {
            properties: { bad_funding: { const: true } },
            required: ["bad_funding"],
          },
          then: { required: ["bad_funding_explanation"] },
        },
        {
          if: {
            properties: { fun_ding_type: { const: "Supplement" } },
            required: ["fun_ding_type"],
          },
          then: { required: ["fun_ding_numbers"] },
        },
      ],
    });
  });
});
