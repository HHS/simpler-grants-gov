import { useTranslations } from "next-intl";
import { ReactElement } from "react";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
import { NotificationOrganization } from "./NotificationTypes";

export interface OrganizationPreferenceSectionProps {
  organization: NotificationOrganization;
  label: string;
  description: string;
  isChecked: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function OrganizationPreferenceSection({
  organization,
  label,
  description,
  isChecked,
  isDisabled = false,
  isLoading = false,
  hasError = false,
  errorMessage,
  onCheckedChange,
}: OrganizationPreferenceSectionProps): ReactElement {
  const t = useTranslations("Notifications");
  const organizationHeadingId = `organization-${organization.organizationId}`;

  return (
    <section aria-labelledby={organizationHeadingId} className="margin-top-5">
      <h3 id={organizationHeadingId} className="margin-bottom-2">
        {organization.organizationName}
        <span className="usa-sr-only">
          {t("organizationPreferencesSuffix")}
        </span>
      </h3>

      <NotificationPreferenceCard
        checkboxId={`organization-${organization.organizationId}-saved-opportunities`}
        label={label}
        description={description}
        isChecked={isChecked}
        isDisabled={isDisabled}
        isLoading={isLoading}
        hasError={hasError}
        errorMessage={errorMessage}
        organizationHeadingId={organizationHeadingId}
        onCheckedChange={onCheckedChange}
      />
    </section>
  );
}
