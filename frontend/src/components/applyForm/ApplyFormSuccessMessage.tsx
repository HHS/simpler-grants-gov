import { Alert } from "@trussworks/react-uswds";

export const ApplyFormSuccessMessage = ({ message }: { message: string }) => {
  return (
    message && (
      <Alert heading={message} headingLevel="h3" type="success">
        Form succesfully saved.
      </Alert>
    )
  );
};
