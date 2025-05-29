"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export function ClearSearchButton({
  buttonText,
  includeIcon = false,
  className,
}: {
  buttonText: string;
  includeIcon?: boolean;
  className?: string;
}) {
  const { clearQueryParams } = useSearchParamUpdater();
  return (
    <Button
      unstyled
      type="button"
      onClick={() => clearQueryParams()}
      className={className}
    >
      {includeIcon && (
        <USWDSIcon
          name="close"
          className="margin-right-05 margin-left-neg-05"
        />
      )}
      {buttonText}
    </Button>
  );
}
