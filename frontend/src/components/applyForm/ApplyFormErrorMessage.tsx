import { ErrorObject } from "ajv";

import { Alert } from "@trussworks/react-uswds";

export const ApplyFormErrorMessage = ({
  heading,
  errors,
}: {
  heading: string;
  errors: ErrorObject<string, Record<string, unknown>, unknown>[];
}) => {
  return (
    errors.length > 0 && (
      <Alert heading={heading} headingLevel="h3" type="error">
        This form has {errors.length} errors.
      </Alert>
    )
  );
};
