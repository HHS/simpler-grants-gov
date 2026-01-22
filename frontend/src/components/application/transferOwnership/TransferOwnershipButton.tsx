"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type TransferOwnershipButtonProps = {
  onClick: () => void;
};

export function TransferOwnershipButton({
  onClick,
}: TransferOwnershipButtonProps) {
  const t = useTranslations("Application.information");

  const handleClick = useCallback((): void => {
    onClick();
  }, [onClick]);

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="usa-button usa-button--success margin-left-1"
      secondary
      data-testid="transfer-ownership-open"
    >
      <USWDSIcon name="settings" />
      {t("transferApplicaitonOwnership")}
    </Button>
  );
}
