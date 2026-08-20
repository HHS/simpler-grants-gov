import { z } from "zod";

import { getTranslations } from "next-intl/server";

import {
  mapServerApiValidationErrors,
  validateZodFormData,
} from "./zodServerValidation";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

const mockGetTranslations = jest.mocked(getTranslations);

const createTranslator = (translations: Record<string, string>) => {
  const translator = ((key: string) => translations[key] ?? key) as {
    (key: string): string;
    has: (key: string) => boolean;
  };

  translator.has = (key: string) => key in translations;

  return translator;
};

describe("validateZodFormData", () => {
  const genericTranslations = createTranslator({
    required: "This field is required.",
    invalid: "Enter a valid value.",
    min_or_max_value: "Enter a value within the allowed range.",
  });

  beforeEach(() => {
    mockGetTranslations.mockResolvedValue(
      genericTranslations as Awaited<ReturnType<typeof getTranslations>>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed data when validation succeeds", async () => {
    const schema = z.object({
      name: z.string(),
      amount: z.number(),
    });

    const formData = new FormData();
    formData.set("name", "Example");
    formData.set("amount", "100");

    const fieldTranslations = createTranslator({});
    const getValidationData = jest.fn().mockReturnValue({
      name: "Example",
      amount: 100,
    });

    const result = await validateZodFormData({
      schema,
      formData,
      fieldTranslations,
      getValidationData,
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Example",
        amount: 100,
      },
    });

    expect(getValidationData).toHaveBeenCalledWith(formData);
  });

  it("returns translated validation errors when validation fails", async () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const formData = new FormData();

    const fieldTranslations = createTranslator({
      "name.min_or_max_value": "Name must be at least 3 characters.",
    });

    const getValidationData = jest.fn().mockReturnValue({
      name: "a",
    });

    const result = await validateZodFormData({
      schema,
      formData,
      fieldTranslations,
      getValidationData,
    });

    expect(result).toEqual({
      success: false,
      validationErrors: {
        name: ["Name must be at least 3 characters."],
      },
    });
  });

  it("uses generic translations when there is no field-specific translation", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const formData = new FormData();

    const fieldTranslations = createTranslator({});
    const getValidationData = jest.fn().mockReturnValue({
      name: undefined,
    });

    const result = await validateZodFormData({
      schema,
      formData,
      fieldTranslations,
      getValidationData,
    });

    expect(result).toEqual({
      success: false,
      validationErrors: {
        name: ["This field is required."],
      },
    });
  });

  it("loads generic validation translations", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const formData = new FormData();

    await validateZodFormData({
      schema,
      formData,
      fieldTranslations: createTranslator({}),
      getValidationData: () => ({
        name: "Example",
      }),
    });

    expect(mockGetTranslations).toHaveBeenCalledWith(
      "genericValidationMessages",
    );
  });
});

describe("mapServerApiValidationErrors", () => {
  const genericTranslations = createTranslator({
    required: "This field is required.",
    invalid: "Enter a valid value.",
  });

  beforeEach(() => {
    mockGetTranslations.mockResolvedValue(
      genericTranslations as Awaited<ReturnType<typeof getTranslations>>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps API validation errors to translated field errors", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const fieldTranslations = createTranslator({
      "name.required": "Name is required.",
    });

    const result = await mapServerApiValidationErrors(
      {
        errors: [
          {
            field: "name",
            type: "required",
            message: "Backend validation message",
          },
        ],
      },
      schema,
      fieldTranslations,
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: {
        name: ["Name is required."],
      },
      errorMessage: undefined,
    });
  });

  it("returns unmapped API errors as a top-level error", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const result = await mapServerApiValidationErrors(
      {
        errors: [
          {
            field: "not_on_form",
            type: "invalid",
            message: "Something specific went wrong.",
          },
        ],
      },
      schema,
      createTranslator({}),
      "Something went wrong.",
    );

    expect(result).toEqual({
      validationErrors: undefined,
      errorMessage: "Something specific went wrong.",
    });
  });

  it("loads generic validation translations", async () => {
    const schema = z.object({
      name: z.string(),
    });

    await mapServerApiValidationErrors(
      {},
      schema,
      createTranslator({}),
      "Something went wrong.",
    );

    expect(mockGetTranslations).toHaveBeenCalledWith(
      "genericValidationMessages",
    );
  });
});
