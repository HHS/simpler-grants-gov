"use client";

import { useTranslations } from "next-intl";
import { ReactElement } from "react";
import { Checkbox } from "@trussworks/react-uswds";

import Spinner from "src/components/Spinner";

export interface NotificationPreferenceCardProps {
  checkboxId: string;
  label: string;
  description: string;
  isChecked: boolean;
  organizationHeadingId?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function NotificationPreferenceCard({
  checkboxId,
  label,
  description,
  isChecked,
  organizationHeadingId,
  isDisabled = false,
  isLoading = false,
  hasError = false,
  errorMessage,
  onCheckedChange,
}: NotificationPreferenceCardProps): ReactElement {
  const t = useTranslations("Notifications");

  const ariaLabelledBy = organizationHeadingId
    ? `${organizationHeadingId} ${checkboxId}-label`
    : `${checkboxId}-label`;

  const descriptionId = `${checkboxId}-description`;

  const cardClassName = [
    "notification-preference-card",
    "border",
    "border-base-lighter",
    "radius-sm",
    "padding-3",
    hasError ? "notification-preference-card--error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClassName} aria-busy={isLoading}>
      <div className="notification-preference-card__field">
        <div className="display-flex flex-justify flex-align-start">
          <div className="flex-fill margin-right-2">
            <label
              htmlFor={checkboxId}
              id={`${checkboxId}-label`}
              className="text-bold margin-0"
            >
              {label}
            </label>

            <div id={descriptionId}>
              <p className="margin-top-05 margin-bottom-0 text-base text-base-dark">
                {description}
              </p>

              {hasError && errorMessage ? (
                <p className="notification-preference-card__error margin-top-1 margin-bottom-0">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="notification-preference-card__control flex-shrink-0">
            <Checkbox
              id={checkboxId}
              name={checkboxId}
              checked={isChecked}
              disabled={isDisabled || isLoading}
              onChange={(event) => {
                onCheckedChange?.(event.currentTarget.checked);
              }}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={descriptionId}
              label={undefined}
            />

            <div
              className="notification-preference-card__status"
              aria-live="polite"
            >
              {isLoading ? (
                <span className="notification-preference-card__loading display-inline-flex flex-align-center">
                  <Spinner className="width-3 height-3 margin-top-1 margin-right-1" />
                  <span className="usa-sr-only">{t("srPendingSave")}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
