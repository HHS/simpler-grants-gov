import { Button } from "@trussworks/react-uswds";

import Spinner from "src/components/Spinner";

export function LoadingButton({
  message,
  id,
}: {
  message: string;
  id?: string;
}) {
  return (
    <Button type="button" disabled data-testid={id}>
      <Spinner />
      {message}
    </Button>
  );
}
