"use client";

import { ReactElement } from "react";
import { Checkbox } from "@trussworks/react-uswds";

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
  const ariaLabelledBy = organizationHeadingId
    ? `${organizationHeadingId} ${checkboxId}-label`
    : `${checkboxId}-label`;

  const ariaDescribedBy = hasError
    ? `${checkboxId}-description ${checkboxId}-error`
    : `${checkboxId}-description`;

  return (
    <div
      className={`notification-preference-card border border-base-lighter radius-sm padding-3${
        hasError ? " notification-preference-card--error" : ""
      }`}
      aria-busy={isLoading}
    >
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

            <p
              id={`${checkboxId}-description`}
              className="margin-top-05 margin-bottom-0 text-base text-base-dark"
            >
              {description}
            </p>

            {hasError && errorMessage ? (
              <p
                id={`${checkboxId}-error`}
                className="notification-preference-card__error margin-top-1 margin-bottom-0"
              >
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="flex-shrink-0">
            <Checkbox
              id={checkboxId}
              name={checkboxId}
              checked={isChecked}
              disabled={isDisabled || isLoading}
              onChange={(event) => {
                onCheckedChange?.(event.target.checked);
              }}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              label={undefined}
            />
          </div>
        </div>

        <div
          className="notification-preference-card__status"
          aria-live="polite"
        >
          {isLoading ? (
            <span className="notification-preference-card__loading-text">
              Saving...
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
