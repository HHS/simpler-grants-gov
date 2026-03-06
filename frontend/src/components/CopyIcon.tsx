import { useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

interface CopyIconProps {
  content: string;
  className?: string;
  "aria-label"?: string;
}
const CopyIcon = ({
  content,
  className,
  "aria-label": ariaLabel,
}: CopyIconProps) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      className={className}
      unstyled
      type="button"
      aria-label={ariaLabel}
      onClick={() => {
        navigator.clipboard
          .writeText(content)
          .then(() => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 2000);
          })
          .catch((e) => {
            console.error("Error copying to clipboard", e);
          });
      }}
    >
      {copied ? (
        <USWDSIcon className="usa-icon--size-2" name="check" />
      ) : (
        <USWDSIcon className="usa-icon--size-2" name="content_copy" />
      )}
    </Button>
  );
};

export default CopyIcon;
