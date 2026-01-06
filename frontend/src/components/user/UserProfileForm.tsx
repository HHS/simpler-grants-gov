"use client";

import { userProfileAction } from "src/app/[locale]/(base)/settings/actions";
import {
  UserDetailWithProfile,
  UserProfileValidationErrors,
} from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useEffect, useActionState } from "react";
import { Alert, Button, FormGroup, Label, TextInput } from "@trussworks/react-uswds";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";
import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";

const UserProfileValidationError =
  ConditionalFormActionError<UserProfileValidationErrors>;

// note that the userDetails passed in from the user details fetch via the parent
// does nest the user profile information within a profile object, but the
// response from the update call does not, resulting in dealing with
// two different data shapes here.
export function UserProfileForm({
  userDetails,
}: {
  userDetails: UserDetailWithProfile;
}) {
  const t = useTranslations("Settings");

  const [state, formAction, isPending] = useActionState(userProfileAction, {
    validationErrors: {},
  });

  const firstName = state.data?.first_name || userDetails.profile?.first_name;
  const lastName = state.data?.last_name || userDetails.profile?.last_name;
  const isMissingName = !firstName || !lastName;

  // Dispatch event when profile is successfully updated
  useEffect(() => {
    if (state?.success) {
      window.dispatchEvent(new CustomEvent("userProfileUpdated"));
    }
  }, [state?.success]);

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
      {isMissingName && (
        <Alert heading={t("missingFullName")} headingLevel="h2" type="warning" />
      )}
      <h2>{t("contactInfoHeading")}</h2>
      <p>
        {t.rich("contactInfoBody", {
          link: (chunk) => (
            <a href="https://login.gov" target="_blank">
              {chunk}
            </a>
          ),
        })}
      </p>
      <form action={formAction}>
        <FormGroup error={!!state.validationErrors?.firstName}>
          <Label htmlFor="firstName">
            <span>{t("inputs.firstName")}</span>
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <UserProfileValidationError
            fieldName="firstName"
            errors={state.validationErrors}
          />
          <TextInput
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={
              state.data?.first_name || userDetails.profile?.first_name
            }
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="middle-name">{t("inputs.middleName")}</Label>
          <TextInput
            id="middle-name"
            name="middleName"
            type="text"
            defaultValue={
              state.data?.middle_name || userDetails.profile?.middle_name
            }
          />
        </FormGroup>
        <FormGroup error={!!state.validationErrors?.lastName}>
          <Label htmlFor="lastName">
            <span>{t("inputs.lastName")}</span>
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <UserProfileValidationError
            fieldName="lastName"
            errors={state.validationErrors}
          />
          <TextInput
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={state.data?.last_name || userDetails.profile?.last_name}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="email">{t("inputs.email")}</Label>
          <TextInput
            id="email"
            name="email"
            type="text"
            defaultValue={userDetails.email}
            disabled
          />
        </FormGroup>
        <Button type="submit" disabled={isPending} className="margin-top-4">
          {t(isPending ? "pending" : "save")}
        </Button>
      </form>
    </>
  );
}
