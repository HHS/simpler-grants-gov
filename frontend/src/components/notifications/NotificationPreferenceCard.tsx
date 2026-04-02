"use client";

import { ReactElement } from "react";

import { SimplerSwitchField } from "src/components/SimplerSwitch";

interface NotificationPreferenceCardProps {
  checkboxId: string;
  label: string;
  description: string;
  isChecked: boolean;
  organizationHeadingId?: string;
  ariaLabel?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function NotificationPreferenceCard({
  checkboxId,
  label,
  description,
  isChecked,
  ariaLabel,
  organizationHeadingId,
  isDisabled = false,
  isLoading = false,
  hasError = false,
  onCheckedChange,
}: NotificationPreferenceCardProps): ReactElement {
  const fieldLabelId = `${checkboxId}-label`;
  const ariaLabelledBy = organizationHeadingId
    ? `${organizationHeadingId} ${fieldLabelId}`
    : undefined;

  return (
    <div
      className="notification-preference-card border border-base-lighter radius-sm padding-3"
      aria-busy={isLoading}
    >
      <div className="notification-preference-card__field">
        <SimplerSwitchField
          id={checkboxId}
          ariaLabel={ariaLabel}
          label={label}
          description={description}
          checked={isChecked}
          disabled={isDisabled || isLoading}
          onCheckedChange={onCheckedChange ?? (() => {})}
          errorMessage={hasError ? " " : undefined}
          labelClassName="text-bold margin-0"
          descriptionClassName="margin-top-05 margin-bottom-0 text-base text-base-dark"
          ariaLabelledBy={ariaLabelledBy}
        />

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
