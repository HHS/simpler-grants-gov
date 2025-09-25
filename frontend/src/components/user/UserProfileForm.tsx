"use client";

import { userProfileAction } from "src/app/[locale]/(base)/user/actions";
import { UserDetail, UserProfileValidationErrors } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, Label, TextInput } from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

const UserProfileValidationError =
  ConditionalFormActionError<UserProfileValidationErrors>;

export function UserProfileForm({ userDetails }: { userDetails: UserDetail }) {
  const t = useTranslations("UserProfile");

  const [state, formAction, isPending] = useActionState(userProfileAction, {
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
        defaultValue={state.data?.first_name || userDetails.first_name}
      />
      <Label htmlFor="middle-name">{t("inputs.middleName")}</Label>
      <TextInput
        id="edit-user-middle-name"
        name="middleName"
        type="text"
        defaultValue={state.data?.middle_name || userDetails.middle_name}
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
        defaultValue={state.data?.last_name || userDetails.last_name}
      />
      <Label htmlFor="email">{t("inputs.email")}</Label>
      <TextInput
        id="edit-user-email"
        name="email"
        type="text"
        defaultValue={userDetails.email}
        disabled
      />
      <Button type="submit" disabled={isPending} className="margin-top-4">
        {t(isPending ? "pending" : "save")}
      </Button>
    </form>
  );
}
