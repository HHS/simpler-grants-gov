import { UserRole } from "src/types/userTypes";
import { useTranslations } from "use-intl";

import {
  Button,
  FormGroup,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

export const rolesToOptions = (roles) => {
  return [<option key="a">hi</option>];
};

export function UserInviteButton({ success = false, disabled = false }) {
  const t = useTranslations("ManageUsers.inviteUser.button");
  if (success) {
    return <div>{t("success")}</div>;
  }
  return (
    <Button disabled={disabled} type="button">
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
  const roleOptions = rolesToOptions(roles);
  return (
    <form>
      <FormGroup>
        <Label htmlFor="email">{t("inputs.email.label")}</Label>
        <TextInput
          name="email"
          id="inviteUser-email"
          type="email"
          placeholder={t("inputs.email.placeholder")}
        />
        <Label htmlFor="email">{t("inputs.role.label")}</Label>
        <Select
          name="role"
          id="inviteUser-role"
          defaultValue={t("inputs.role.placeholder")}
        >
          {roleOptions}
        </Select>
      </FormGroup>
      <UserInviteButton />
    </form>
  );
}

export function UserInvite({ organizationId }: { organizationId: string }) {
  // fetch roles for organization (this will happen in page gate eventually)
  // display heading info
  const t = useTranslations("ManageUsers.inviteUser");
  return (
    <>
      <h3>{t("heading")}</h3>
      <div>{t("description")}</div>
      <UserInviteForm organizationId={organizationId} roles={[]} />
    </>
  );
}
