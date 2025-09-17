import { getSession } from "src/services/auth/session";

import { getTranslations } from "next-intl/server";
import {
  Button,
  GridContainer,
  Label,
  TextInput,
} from "@trussworks/react-uswds";

import { userProfileAction } from "./actions";

export default async function UserProfile() {
  const t = await getTranslations("UserProfile");

  const session = await getSession();
  if (!session?.email) {
    // this won't happen, as email is required on sessions, and we're wrapping this in an auth gate in the layout
    return;
  }
  return (
    <GridContainer>
      <h1>{t("title")}</h1>
      <form action={userProfileAction}>
        <Label htmlFor="first-name">{t("inputs.firstName")}</Label>
        <TextInput
          id="edit-user-first-name"
          name="first-name"
          type="text"
          required
        />
        <Label htmlFor="middle-name">{t("inputs.middleName")}</Label>
        <TextInput id="edit-user-middle-name" name="middle-name" type="text" />
        <Label htmlFor="last-name">{t("inputs.lastName")}</Label>
        <TextInput
          id="edit-user-last-name"
          name="last-name"
          type="text"
          required
        />
        <Label htmlFor="email">{t("inputs.email")}</Label>
        <TextInput
          id="edit-user-email"
          name="email"
          type="text"
          defaultValue={session.email}
          disabled
        />
        <Button type="submit" className="margin-top-4">
          {t("save")}
        </Button>
      </form>
    </GridContainer>
  );
}
