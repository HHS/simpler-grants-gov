import { FrontendErrorDetails } from "src/types/apiResponseTypes";

// Maps a 422's errors[] to inline validationErrors by field, with a top-level errorMessage
// fallback for field-less business-rule errors (which return an empty errors[] and put the
// real text in the response's top-level message instead).
export function mapApiValidationErrors(
  response: { errors?: unknown[] | null; message?: string },
  genericMessage: string,
  validFields: string[] | readonly string[],
): { validationErrors?: { [field: string]: string[] }; errorMessage?: string } {
  const validationErrors = {} as {
    [field: (typeof validFields)[number]]: string[];
  };
  const unmappedMessages: string[] = [];

  for (const rawError of response.errors ?? []) {
    const error = rawError as FrontendErrorDetails;
    const message = error.message ?? genericMessage;
    const field = error.field;

    if (field && validFields.includes(field)) {
      validationErrors[field] = [...(validationErrors[field] ?? []), message];
    } else {
      unmappedMessages.push(message);
    }
  }

  const hasFieldErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors: hasFieldErrors ? validationErrors : undefined,
    errorMessage:
      unmappedMessages.length > 0
        ? unmappedMessages.join(" ")
        : hasFieldErrors
          ? undefined
          : response.message, // note that this used to fall back to a generic message, but that resulted in showing an error when there was none
  };
}
