import { z } from "zod";

import { getTranslations } from "next-intl/server";

import { ZodSchema } from "./zodFormData";
import {
  getZodValidationErrors,
  mapApiValidationErrors,
} from "./zodValidation";

type ValidationTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

type ValidateZodFormDataOptions<TSchema extends ZodSchema> = {
  schema: TSchema;
  formData: FormData;
  fieldTranslations: ValidationTranslator;

  /**
   * Converts raw FormData into the shape expected by the generated Zod schema.
   * This allows forms to provide any form-specific adapters while keeping the
   * validation flow itself generic.
   */
  getValidationData: (formData: FormData) => Record<string, unknown>;
};

/**
 * Result returned by server-side Zod form validation.
 *
 * On success, `data` contains the parsed/normalized output from Zod.
 * On failure, callers receive field-level translated validation errors.
 */
type ZodFormValidationResult<TSchema extends ZodSchema> =
  | {
      success: true;
      data: z.output<TSchema>;
    }
  | {
      success: false;
      validationErrors: Record<string, string[]>;
    };

/**
 * Server-side wrapper around the shared API validation error mapper.
 *
 * Generic validation translations are resolved here so the lower-level
 * validation utilities remain environment-agnostic and can be reused by
 * both client and server code.
 */
export async function mapServerApiValidationErrors(
  response: { errors?: unknown[] | null; message?: string },
  schema: z.ZodTypeAny,
  fieldTranslations: ValidationTranslator,
  genericMessage: string,
) {
  const genericTranslations = await getTranslations(
    "genericValidationMessages",
  );

  return mapApiValidationErrors(
    response,
    schema,
    fieldTranslations,
    genericTranslations,
    genericMessage,
  );
}

/**
 * Validates FormData against a generated Zod schema on the server.
 *
 * The caller supplies the form-specific translation namespace and the logic
 * used to convert FormData into validation input. This helper owns the common
 * validation flow and generic validation translations.
 *
 * Successful validation returns Zod's parsed output so callers can use the
 * normalized, schema-validated data directly when building API requests.
 */
export async function validateZodFormData<TSchema extends ZodSchema>({
  schema,
  formData,
  fieldTranslations,
  getValidationData,
}: ValidateZodFormDataOptions<TSchema>): Promise<
  ZodFormValidationResult<TSchema>
> {
  const genericTranslations = await getTranslations(
    "genericValidationMessages",
  );

  const validationData = getValidationData(formData);
  const result = schema.safeParse(validationData);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    validationErrors: getZodValidationErrors(
      result.error,
      validationData,
      schema,
      fieldTranslations,
      genericTranslations,
    ),
  };
}
