import { Alert, Grid } from "@trussworks/react-uswds";

export const ApplyFormSuccessMessage = ({ message }: { message: string }) => {
  return (
    message && (
      <Grid>
        <Alert heading={message} headingLevel="h3" type="success">
          Form succesfully saved.
        </Alert>
      </Grid>
    )
  );
};
