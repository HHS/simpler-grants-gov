"use client";

import {
  inviteUserAction,
  OrganizationInviteValidationErrors,
} from "src/app/[locale]/(base)/user/workspace/actions";
import { UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState, useMemo } from "react";
import {
  Alert,
  Button,
  FormGroup,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

const OrganizationInviteValidationError =
  ConditionalFormActionError<OrganizationInviteValidationErrors>;

export const inviteUserActionForOrganization =
  (organizationId: string) => (_prevState: unknown, formData: FormData) =>
    inviteUserAction(_prevState, formData, organizationId);

export const RoleOptions = ({ roles }: { roles: UserRole[] }) => {
  const t = useTranslations("ManageUsers.inviteUser.inputs.role");
  const roleOptions = roles.map((role) => (
    <option key={role.role_id} value={role.role_id}>
      {role.role_name}
    </option>
  ));
  return [
    <option key="default" value="">
      {t("placeholder")}
    </option>,
  ].concat(roleOptions);
};
export function UserInviteButton({ success = false, disabled = false }) {
  const t = useTranslations("ManageUsers.inviteUser.button");
  if (success) {
    return <div>{t("success")}</div>;
  }
  return (
    <Button disabled={disabled} type="submit">
      {t("label")}
    </Button>
  );
}

export function UserInviteForm({
  organizationId,
  roles,
}: {
  organizationId: string;
  roles: UserRole[];
}) {
  // handle form action and state (server action)
  const t = useTranslations("ManageUsers.inviteUser");

  const inviteUser = useMemo(
    () => inviteUserActionForOrganization(organizationId),
    [organizationId],
  );

  const [state, formAction, isPending] = useActionState(inviteUser, {
    success: false,
  });

  return (
    <>
      {state?.errorMessage && (
        <Alert
          heading={t("errorHeading")}
          headingLevel="h2"
          type="warning"
          validation
        >
          {state?.errorMessage}
        </Alert>
      )}
      <form action={formAction}>
        <FormGroup>
          <Label htmlFor="email">
            {t("inputs.email.label")}
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <OrganizationInviteValidationError
            fieldName="email"
            errors={state.validationErrors}
          />
          <TextInput
            name="email"
            id="inviteUser-email"
            type="email"
            placeholder={t("inputs.email.placeholder")}
            value={state.data?.invitee_email}
            disabled={isPending}
          />
          <Label htmlFor="email">
            {t("inputs.role.label")}
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <OrganizationInviteValidationError
            fieldName="role"
            errors={state.validationErrors}
          />
          <Select
            name="role"
            id="inviteUser-role"
            // defaultValue={t("inputs.role.placeholder")}
            disabled={isPending}
            value={state.data?.roles[0].role_name}
          >
            <RoleOptions roles={roles} />
          </Select>
        </FormGroup>
        <UserInviteButton />
      </form>
    </>
  );
}
