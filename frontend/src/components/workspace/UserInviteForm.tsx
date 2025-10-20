"use client";

import { inviteUserAction } from "src/app/[locale]/(base)/user/workspace/actions";
import { UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState, useMemo } from "react";
import {
  Button,
  FormGroup,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

export const inviteUserActionForOrganization =
  (organizationId: string) => (_prevState: unknown, formData: FormData) =>
    inviteUserAction(_prevState, formData, organizationId);

export const rolesToOptions = (roles: UserRole[]) => {
  return roles.map((role) => (
    <option key={role.role_id} value={role.role_id}>
      {role.role_name}
    </option>
  ));
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
  const roleOptions = useMemo(() => rolesToOptions(roles), [roles]);

  const [state, formAction, isPending] = useActionState(inviteUser, {
    success: false,
  });

  return (
    <form action={formAction}>
      <FormGroup>
        <Label htmlFor="email">{t("inputs.email.label")}</Label>
        <TextInput
          name="email"
          id="inviteUser-email"
          type="email"
          placeholder={t("inputs.email.placeholder")}
          value={state.data?.invitee_email}
          disabled={isPending}
        />
        <Label htmlFor="email">{t("inputs.role.label")}</Label>
        <Select
          name="role"
          id="inviteUser-role"
          defaultValue={t("inputs.role.placeholder")}
          disabled={isPending}
          value={state.data?.roles[0].role_name}
        >
          {roleOptions}
        </Select>
      </FormGroup>
      <UserInviteButton />
    </form>
  );
}
