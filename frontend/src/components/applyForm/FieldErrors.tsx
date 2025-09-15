import { JSONSchema7TypeName } from "json-schema";

import { ErrorMessage } from "@trussworks/react-uswds";

export const FieldErrors = ({
  type,
  fieldName,
  rawErrors,
}: {
  type: JSONSchema7TypeName | JSONSchema7TypeName[] | string | undefined;
  fieldName: string;
  rawErrors: string[] | Record<string, string>[] | undefined;
}): React.ReactNode | string | null => {
  const safeType = Array.isArray(type) && type.length > 0 ? type[0] : type;
  if (!Array.isArray(rawErrors) || !rawErrors.length || !rawErrors)
    return null;
  let errors = rawErrors;
  if (safeType === "array") {
    errors = rawErrors
      .filter(
        (error): error is Record<string, string> =>
          typeof error === "object" &&
          error !== null &&
          !Array.isArray(error) &&
          fieldName in error,
      )
      .map((error) => error[fieldName]);
  }
  if (errors.length > 1) {
    return (
      <ErrorMessage id={`error-for-${fieldName}`}>
        <ul>
          {errors.map((error, idx) => (
            <li key={idx}>{String(error)}</li>
          ))}
        </ul>
      </ErrorMessage>
    );
  }
  return (
    <ErrorMessage id={`error-for-${fieldName}`}>
      {String(errors[0])}
    </ErrorMessage>
  );
};
