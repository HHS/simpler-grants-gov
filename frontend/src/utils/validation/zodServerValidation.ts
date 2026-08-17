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
  getValidationData: (formData: FormData) => Record<string, unknown>;
};

type ZodFormValidationResult<TSchema extends ZodSchema> =
  | {
      success: true;
      data: z.output<TSchema>;
    }
  | {
      success: false;
      validationErrors: Record<string, string[]>;
    };

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
