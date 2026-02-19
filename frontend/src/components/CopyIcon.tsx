import { useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

interface CopyIconProps {
  content: string;
  className?: string;
}
const CopyIcon = ({ content, className }: CopyIconProps) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      className={className}
      unstyled
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(content).catch(console.error);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
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
