import { Alert } from "@trussworks/react-uswds";

import { FormValidationWarning } from "./types";

export const ApplyFormMessage = ({
  errorMessage,
  validationWarnings,
  submitted,
}: {
  errorMessage: string;
  validationWarnings: FormValidationWarning[] | null;
  submitted: boolean;
}) => {
  if (!submitted) {
    return <></>;
  } else if (errorMessage && errorMessage.length > 0) {
    return (
      <Alert heading={"Error saving form"} headingLevel="h2" type="error">
        {errorMessage}
      </Alert>
    );
  } else if (validationWarnings && validationWarnings.length > 0) {
    return (
      <Alert heading={"Form was saved"} headingLevel="h2" type="warning">
        This form has {validationWarnings.length} errors.
      </Alert>
    );
  } else {
    return (
      <Alert heading={"Form saved"} headingLevel="h3" type="success">
        Form saved.
      </Alert>
    );
  }
};
