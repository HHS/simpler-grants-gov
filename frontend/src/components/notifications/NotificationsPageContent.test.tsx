import { NotificationPreferenceCardProps } from "./NotificationPreferenceCard";
import { OrganizationPreferenceSectionProps } from "./OrganizationPreferenceSection";

type MockNotificationPreferenceCardProps = Pick<
  NotificationPreferenceCardProps,
  | "checkboxId"
  | "label"
  | "isDisabled"
  | "isLoading"
  | "hasError"
  | "errorMessage"
  | "onCheckedChange"
>;

jest.mock("./NotificationPreferenceCard", () => ({
  NotificationPreferenceCard: ({
    checkboxId,
    label,
    isDisabled,
    isLoading,
    hasError,
    errorMessage,
    onCheckedChange,
  }: MockNotificationPreferenceCardProps) => (
    <div data-testid={`card-${checkboxId}`}>
      <span>{label}</span>

      <button
        type="button"
        onClick={() => onCheckedChange?.(true)}
        disabled={isDisabled}
        data-testid={`toggle-${checkboxId}`}
      >
        toggle
      </button>

      {isLoading ? <span>Saving...</span> : null}
      {hasError ? <span>{errorMessage}</span> : null}
    </div>
  ),
}));

type MockOrganizationPreferenceSectionProps = Pick<
  OrganizationPreferenceSectionProps,
  | "organization"
  | "isChecked"
  | "isLoading"
  | "hasError"
  | "errorMessage"
  | "onCheckedChange"
>;

jest.mock("./OrganizationPreferenceSection", () => ({
  OrganizationPreferenceSection: ({
    organization,
    isChecked,
    isLoading,
    hasError,
    errorMessage,
    onCheckedChange,
  }: MockOrganizationPreferenceSectionProps) => (
    <div data-testid={`org-section-${organization.organizationId}`}>
      <span>{organization.organizationName}</span>
      <span>{isChecked ? "checked" : "unchecked"}</span>

      <button
        type="button"
        onClick={() => onCheckedChange?.(true)}
        disabled={isLoading}
        data-testid={`org-toggle-${organization.organizationId}`}
      >
        toggle
      </button>

      {isLoading ? <span>Saving...</span> : null}
      {hasError ? <span>{errorMessage}</span> : null}
    </div>
  ),
}));
