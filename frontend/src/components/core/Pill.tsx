import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

export function Pill({
  label,
  onClose,
  labelPrefix,
}: {
  label: string;
  onClose: () => void;
  labelPrefix?: string;
}) {
  const ariaLabel = labelPrefix
    ? `Remove ${labelPrefix},${label}`
    : `Remove ${label} pill`;
  return (
    <div className="border-secondary-darker border-2px radius-pill display-inline-block padding-x-2 padding-y-1 bg-secondary-lightest">
      <div className="display-flex">
        <div>{label}</div>
        <Button
          unstyled
          type="button"
          aria-label={ariaLabel}
          className="display-flex flex-align-center margin-left-1"
          onClick={() => {
            onClose();
          }}
        >
          <USWDSIcon
            name="close"
            className="usa-icon--size-3 text-secondary-darker"
          />
        </Button>
      </div>
    </div>
  );
}
