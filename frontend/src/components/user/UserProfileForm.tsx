"use client";

import { userProfileAction } from "src/app/[locale]/(base)/user/account/actions";
import { UserDetail, UserProfileValidationErrors } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Label, TextInput } from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

const UserProfileValidationError =
  ConditionalFormActionError<UserProfileValidationErrors>;

export function UserProfileForm({ userDetails }: { userDetails: UserDetail }) {
  const t = useTranslations("UserAccount");

  const [state, formAction, isPending] = useActionState(userProfileAction, {
    validationErrors: {},
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
      {state?.success && (
        <Alert heading={t("successHeading")} headingLevel="h2" type="success" />
      )}
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
          defaultValue={
            state.data?.profile?.first_name || userDetails.profile?.first_name
          }
        />
        <Label htmlFor="middle-name">{t("inputs.middleName")}</Label>
        <TextInput
          id="edit-user-middle-name"
          name="middleName"
          type="text"
          defaultValue={
            state.data?.profile?.middle_name || userDetails.profile?.middle_name
          }
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
          defaultValue={
            state.data?.profile?.last_name || userDetails.profile?.last_name
          }
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
    </>
  );
}
