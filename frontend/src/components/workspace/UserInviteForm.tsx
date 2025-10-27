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
  Grid,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";
import { USWDSIcon } from "src/components/USWDSIcon";

const OrganizationInviteValidationError =
  ConditionalFormActionError<OrganizationInviteValidationErrors>;

// in order to pass the organizationId into the form action call
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
    return (
      <div className="margin-top-4 margin-right-1 padding-y-1 padding-x-3 display-inline-flex flex-align-center tablet:margin-top-0">
        <USWDSIcon
          className="usa-icon margin-right-05 margin-left-neg-05"
          name="check_circle_outline"
          key="success-icon"
        />
        {t("success")}
      </div>
    );
  }
  return (
    <Button
      disabled={disabled}
      type="submit"
      className="tablet:margin-top-0 margin-top-4"
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="send"
        key="send-icon"
      />
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
        <Grid row gap="md">
          <Grid tablet={{ col: 4 }}>
            <FormGroup error={!!formState.validationErrors?.email}>
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
            </FormGroup>
          </Grid>
          <Grid tablet={{ col: 4 }}>
            <FormGroup error={!!formState.validationErrors?.role}>
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
          </Grid>
          <Grid tablet={{ col: 4 }} className="flex-align-self-end">
            <UserInviteButton
              disabled={isPending || showSuccess}
              success={showSuccess}
            />
          </Grid>
        </Grid>
      </form>
    </>
  );
}
