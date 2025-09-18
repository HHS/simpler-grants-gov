"use client";

import {
  userProfileAction,
  UserProfileValidationErrors,
} from "src/app/[locale]/(base)/user/actions";
import { UserDetail } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, Label, TextInput } from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

const UserProfileValidationError =
  ConditionalFormActionError<UserProfileValidationErrors>;

export function UserProfileForm({ userDetails }: { userDetails: UserDetail }) {
  const t = useTranslations("UserProfile");

  const [state, formAction] = useActionState(userProfileAction, {
    validationErrors: {},
  });

  return (
    <form action={formAction}>
      <Label htmlFor="firstName">
        <span>{t("inputs.firstName")}</span>
        <RequiredFieldIndicator> *</RequiredFieldIndicator>
      </Label>
      <UserProfileValidationError
        fieldName="firstName"
        errors={state.validationErrors}
      />
      <TextInput
        id="edit-user-first-name"
        name="firstName"
        type="text"
        defaultValue={userDetails.first_name}
      />
      <Label htmlFor="middle-name">{t("inputs.middleName")}</Label>
      <TextInput
        id="edit-user-middle-name"
        name="middleName"
        type="text"
        defaultValue={userDetails.middle_name}
      />
      <Label htmlFor="lastName">
        <span>{t("inputs.lastName")}</span>
        <RequiredFieldIndicator> *</RequiredFieldIndicator>
      </Label>
      <UserProfileValidationError
        fieldName="lastName"
        errors={state.validationErrors}
      />
      <TextInput
        id="edit-user-last-name"
        name="lastName"
        type="text"
        defaultValue={userDetails.last_name}
      />
      <Label htmlFor="email">{t("inputs.email")}</Label>
      <TextInput
        id="edit-user-email"
        name="email"
        type="text"
        defaultValue={userDetails.email}
        disabled
      />
      <Button type="submit" className="margin-top-4">
        {t("save")}
      </Button>
    </form>
  );
}
