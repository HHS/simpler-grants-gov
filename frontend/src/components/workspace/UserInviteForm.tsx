"use client";

import {
  inviteUserAction,
  OrganizationInviteValidationErrors,
} from "src/app/[locale]/(base)/user/workspace/actions";
import { UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState } from "react";
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

  const [showSuccess, setShowSuccess] = useState(false);

  const inviteUser = useMemo(
    () => inviteUserActionForOrganization(organizationId),
    [organizationId],
  );

  const [formState, formAction, isPending] = useActionState(inviteUser, {
    success: false,
  });

  useEffect(() => {
    if (formState.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [formState.success]);

  return (
    <>
      {formState?.errorMessage && (
        <Alert
          heading={t("errorHeading")}
          headingLevel="h2"
          type="warning"
          validation
        >
          {formState?.errorMessage}
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
            errors={formState.validationErrors}
          />
          <TextInput
            name="email"
            id="inviteUser-email"
            type="email"
            placeholder={t("inputs.email.placeholder")}
            disabled={isPending || showSuccess}
          />
          <Label htmlFor="email">
            {t("inputs.role.label")}
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <OrganizationInviteValidationError
            fieldName="role"
            errors={formState.validationErrors}
          />
          <Select
            name="role"
            id="inviteUser-role"
            // defaultValue={t("inputs.role.placeholder")}
            disabled={isPending || showSuccess}
            value={formState.data?.roles[0].role_name}
          >
            <RoleOptions roles={roles} />
          </Select>
        </FormGroup>
        <UserInviteButton
          disabled={isPending || showSuccess}
          success={showSuccess}
        />
      </form>
    </>
  );
}
