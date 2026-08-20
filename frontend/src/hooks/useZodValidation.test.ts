import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import { useZodFormValidation } from "./useZodValidation";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translator = ((key: string) => key) as {
      (key: string): string;
      has: (key: string) => boolean;
    };

    translator.has = () => true;

    return translator;
  },
}));

function createTranslator(translations: Record<string, string>) {
  const translator = ((key: string) => translations[key] ?? key) as {
    (key: string): string;
    has: (key: string) => boolean;
  };

  translator.has = (key: string) => key in translations;

  return translator;
}

describe("useZodFormValidation", () => {
  it("returns server errors before frontend validation has run", () => {
    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        serverErrors: {
          name: ["Server error"],
        },
        fieldTranslations: createTranslator({}),
        getValidationData: () => ({
          name: "valid",
        }),
      }),
    );

    expect(result.current.getFieldErrors("name")).toEqual(["Server error"]);
    expect(result.current.getFieldError("name")).toBe("Server error");
  });

  it("ignores fields that are not in the schema", () => {
    const schema = z.object({
      name: z.string(),
    });

    const getValidationData = jest.fn();

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({}),
        getValidationData,
      }),
    );

    const form = document.createElement("form");

    act(() => {
      result.current.validateField("unknown", form);
    });

    expect(getValidationData).not.toHaveBeenCalled();
  });

  it("stores frontend validation errors", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const form = document.createElement("form");

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({
          "name.min_or_max_value": "Name is too short.",
        }),
        getValidationData: () => ({
          name: "a",
        }),
      }),
    );

    act(() => {
      result.current.validateField("name", form);
    });

    expect(result.current.getFieldErrors("name")).toEqual([
      "Name is too short.",
    ]);
  });

  it("frontend errors take precedence over server errors", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const form = document.createElement("form");

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        serverErrors: {
          name: ["Server error"],
        },
        fieldTranslations: createTranslator({
          "name.min_or_max_value": "Frontend error",
        }),
        getValidationData: () => ({
          name: "a",
        }),
      }),
    );

    expect(result.current.getFieldErrors("name")).toEqual(["Server error"]);

    act(() => {
      result.current.validateField("name", form);
    });

    expect(result.current.getFieldErrors("name")).toEqual(["Frontend error"]);
  });

  it("clears frontend errors when the form becomes valid", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    let name = "a";

    const form = document.createElement("form");

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({
          "name.min_or_max_value": "Name is too short.",
        }),
        getValidationData: () => ({
          name,
        }),
      }),
    );

    act(() => {
      result.current.validateField("name", form);
    });

    expect(result.current.getFieldErrors("name")).toEqual([
      "Name is too short.",
    ]);

    name = "Alice";

    act(() => {
      result.current.validateField("name", form);
    });

    expect(result.current.getFieldErrors("name")).toEqual([]);
  });

  it("refreshes existing related field errors", () => {
    const schema = z
      .object({
        minimum: z.number(),
        maximum: z.number(),
      })
      .superRefine((data, ctx) => {
        if (data.minimum > data.maximum) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["minimum"],
            message: "maximum_numeric_order",
          });

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maximum"],
            message: "minimum_numeric_order",
          });
        }
      });

    let values = {
      minimum: 10,
      maximum: 5,
    };

    const form = document.createElement("form");

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({
          "minimum.maximum_numeric_order": "Minimum is too high.",
          "maximum.minimum_numeric_order": "Maximum is too low.",
        }),
        getValidationData: () => values,
      }),
    );

    act(() => {
      result.current.validateField("minimum", form);
    });

    expect(result.current.getFieldErrors("minimum")).toEqual([
      "Minimum is too high.",
    ]);

    values = {
      minimum: 10,
      maximum: 20,
    };

    act(() => {
      result.current.validateField("maximum", form);
    });

    expect(result.current.getFieldErrors("minimum")).toEqual([]);
    expect(result.current.getFieldErrors("maximum")).toEqual([]);
  });

  it("joins multiple errors in getFieldError", () => {
    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        serverErrors: {
          name: ["First error.", "Second error."],
        },
        fieldTranslations: createTranslator({}),
        getValidationData: () => ({
          name: "valid",
        }),
      }),
    );

    expect(result.current.getFieldError("name")).toBe(
      "First error. Second error.",
    );
  });

  it("validates named input fields on blur", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const form = document.createElement("form");
    const input = document.createElement("input");

    input.name = "name";
    form.appendChild(input);

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({
          "name.min_or_max_value": "Name is too short.",
        }),
        getValidationData: () => ({
          name: "a",
        }),
      }),
    );

    act(() => {
      result.current.handleFieldBlur({
        target: input,
        currentTarget: form,
      } as unknown as React.FocusEvent<HTMLFormElement>);
    });

    expect(result.current.getFieldErrors("name")).toEqual([
      "Name is too short.",
    ]);
  });

  it("ignores unnamed fields on blur", () => {
    const schema = z.object({
      name: z.string(),
    });

    const getValidationData = jest.fn();

    const form = document.createElement("form");
    const input = document.createElement("input");

    form.appendChild(input);

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({}),
        getValidationData,
      }),
    );

    act(() => {
      result.current.handleFieldBlur({
        target: input,
        currentTarget: form,
      } as unknown as React.FocusEvent<HTMLFormElement>);
    });

    expect(getValidationData).not.toHaveBeenCalled();
  });

  it("ignores non-form controls on blur", () => {
    const schema = z.object({
      name: z.string(),
    });

    const getValidationData = jest.fn();

    const form = document.createElement("form");
    const div = document.createElement("div");

    form.appendChild(div);

    const { result } = renderHook(() =>
      useZodFormValidation({
        schema,
        fieldTranslations: createTranslator({}),
        getValidationData,
      }),
    );

    act(() => {
      result.current.handleFieldBlur({
        target: div,
        currentTarget: form,
      } as unknown as React.FocusEvent<HTMLFormElement>);
    });

    expect(getValidationData).not.toHaveBeenCalled();
  });
});
