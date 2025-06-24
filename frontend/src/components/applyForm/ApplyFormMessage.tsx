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
      <Alert
        heading={"Form was saved"}
        headingLevel="h2"
        type="warning"
        validation
      >
        Correct the following errors before submitting your application.
        <ul>
          {validationWarnings.map((warning, index) => (
            <li key={index}>
              <a href={warning.field.replace("$.", "#")}>{warning.message}</a>
            </li>
          ))}
        </ul>
      </Alert>
    );
  } else {
    return (
      <Alert heading={"Form was saved"} headingLevel="h3" type="success">
        No errors were detected.
      </Alert>
    );
  }
};
