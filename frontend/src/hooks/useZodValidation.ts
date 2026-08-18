import { isFieldInSchema } from "src/utils/validation/zodFormData";
import { getZodValidationErrors } from "src/utils/validation/zodValidation";
import { z } from "zod";

import { useTranslations } from "next-intl";
import { useState } from "react";

type ValidationTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

type ValidationErrors = Record<string, string[]>;

type UseZodFormValidationOptions = {
  schema: z.ZodTypeAny;
  serverErrors?: ValidationErrors;
  fieldTranslations: ValidationTranslator;
  getValidationData: (formData: FormData) => Record<string, unknown>;
};

export function useZodFormValidation({
  schema,
  serverErrors,
  fieldTranslations,
  getValidationData,
}: UseZodFormValidationOptions) {
  const genericTranslations = useTranslations("genericValidationMessages");
  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, form: HTMLFormElement): void => {
    if (!isFieldInSchema(schema, field)) {
      return;
    }

    const formData = new FormData(form);
    const validationData = getValidationData(formData);

    const result = schema.safeParse(validationData);

    if (result.success) {
      setFrontendErrors((current) => {
        const next = { ...current };

        for (const fieldName of Object.keys(next)) {
          next[fieldName] = [];
        }

        next[field] = [];

        return next;
      });

      return;
    }

    const validationErrors = getZodValidationErrors(
      result.error,
      validationData,
      schema,
      fieldTranslations,
      genericTranslations,
    );

    setFrontendErrors((current) => {
      const fieldsToRefresh = new Set([...Object.keys(current), field]);

      const next = { ...current };

      for (const fieldName of fieldsToRefresh) {
        next[fieldName] = validationErrors[fieldName] ?? [];
      }

      return next;
    });
  };

  const handleFieldBlur = (event: React.FocusEvent<HTMLFormElement>): void => {
    const target = event.target;

    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )) {
      return;
    }

    if (!target.name) {
      return;
    }

    validateField(target.name, event.currentTarget);
  };

  const getFieldErrors = (field: string): string[] => {
    if (field in frontendErrors) {
      return frontendErrors[field] ?? [];
    }

    return serverErrors?.[field] ?? [];
  };

  const getFieldError = (field: string): string | undefined => {
    const errors = getFieldErrors(field);

    return errors.length > 0 ? errors.join(" ") : undefined;
  };

  return {
    getFieldError,
    getFieldErrors,
    handleFieldBlur,
    validateField,
  };
}
