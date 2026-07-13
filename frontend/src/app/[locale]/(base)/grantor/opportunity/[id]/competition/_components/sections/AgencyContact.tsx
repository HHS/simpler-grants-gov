"use client";

import { useTranslations } from "next-intl";
import React, { ChangeEvent, useState } from "react";

import {
  CommonCharacterCount,
  CommonTextInput,
} from "src/components/core/forms/CommonFormFields";

export function AgencyContact() {
  const t = useTranslations("OpportunityCompetition.sectionAgencyContact");

  //--- Validation for Full Name ---
  const [nameValue, setNameValue] = useState<string>("");
  const [hasNameError, setHasNameError] = useState<boolean>(false);
  const [nameErrorMsg, setNameErrorMsg] = useState<string[]>([]);

  // Proactively clear error states as the user types
  const handleNameInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNameValue(e.target.value);

    if (hasNameError) {
      setHasNameError(false);
      setNameErrorMsg([]);
    }
  };

  // Validate on exit (onBlur) using the regular expression
  const handleNameFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value.trim();

    if (!value) {
      setHasNameError(true);
      setNameErrorMsg([t("error.requiredFullName")]);
      return;
    }

    // Success state
    setHasNameError(false);
    setNameErrorMsg([]);
  };

  //--- Validation for Email Address ---
  const [emailValue, setEmailValue] = useState<string>("");
  const [hasEmailError, setHasEmailError] = useState<boolean>(false);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string[]>([]);
  // Production-grade email layout validation regex
  const EMAIL_REGEX =
    /^(?!\.)(?!.*\.\.)([a-z0-9_'+-]*)[a-z0-9_+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;

  // Proactively clear error states as the user types
  const handleEmailInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEmailValue(e.target.value);

    if (hasEmailError) {
      setHasEmailError(false);
      setEmailErrorMsg([]);
    }
  };

  // Validate on exit (onBlur) using the regular expression
  const handleEmailFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value.trim();

    if (!value) {
      setHasEmailError(true);
      setEmailErrorMsg([t("error.requiredEmail")]);
      return;
    }

    if (!EMAIL_REGEX.test(value)) {
      setHasEmailError(true);
      setEmailErrorMsg([t("error.invalidEmail")]);
      return;
    }

    // Success state
    setHasEmailError(false);
    setEmailErrorMsg([]);
  };

  //--- Validation & Special formatting for Phone Number ---
  const [phone, setPhoneValue] = useState<string>("");
  const [hasPhoneError, setHasPhoneError] = useState<boolean>(false);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState<string[]>([]);

  // Validate on exit (onBlur) using the regular expression
  const handlePhoneFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value.trim();

    if (!value) {
      setHasPhoneError(true);
      setPhoneErrorMsg([t("error.requiredPhoneNumber")]);
      return;
    }

    // Success state
    setHasPhoneError(false);
    setPhoneErrorMsg([]);
  };

  // Prevent non-numeric characters from being typed on PC keyboards
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation, control, and deletion shortcut keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ];

    // Allow copy, paste, select-all shortcuts (Ctrl+A, Ctrl+C, Ctrl+V)
    const isModifierKey = e.ctrlKey || e.metaKey;

    // Check if the pressed key is a single digit (0-9)
    const isNumber = /^[0-9]$/.test(e.key);

    // Blocks the physical PC keystroke entirely if it isn't a number
    if (!isNumber && !allowedKeys.includes(e.key) && !isModifierKey) {
      e.preventDefault();
    }
  };

  // Format the numbers and safeguard against pasted content
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 1. Strip all non-digits and limit to 10 characters
    const cleanValue = e.target.value.replace(/\D/g, "").slice(0, 10);

    // 2. Apply formatting using a regex match and replace pattern
    const formattedValue = cleanValue.replace(
      /^(\d{0,3})(\d{0,3})(\d{0,4})$/,
      (_, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`;
        if (p2) return `(${p1}) ${p2}`;
        if (p1) return `(${p1}`;
        return "";
      },
    );

    setPhoneValue(formattedValue);

    // Proactively clear error states as the user types
    if (hasPhoneError) {
      setHasPhoneError(false);
      setPhoneErrorMsg([]);
    }
  };

  //--- Render the component ---
  return (
    <div
      id="agency-contact"
      className="margin-top-4 padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>

      <div className="grid-row grid-gap-2">
        {/* Full name */}
        <div className="tablet:grid-col">
          <CommonCharacterCount
            isTextArea={false}
            labelText={t("fullName")}
            description=""
            fieldId="fullName"
            fieldMaxLength={255}
            isRequired={true}
            defaultValue=""
            value={nameValue}
            onTextChange={handleNameInputChange}
            onFieldBlur={handleNameFieldBlur}
            rawErrors={nameErrorMsg}
          />
        </div>

        {/* Title */}
        <div className="tablet:grid-col">
          <CommonCharacterCount
            isTextArea={false}
            labelText={t("personTitle")}
            description=""
            fieldId="title"
            fieldMaxLength={255}
            isRequired={false}
            onTextChange={() => {}}
            defaultValue=""
          />
        </div>
      </div>

      <div className="grid-row grid-gap-2">
        {/* Email address */}
        <div className="tablet:grid-col">
          <CommonCharacterCount
            isTextArea={false}
            labelText={t("emailAddress")}
            description={t("emailAddressHint")}
            fieldId="emailAddress"
            fieldMaxLength={255}
            isRequired={true}
            defaultValue=""
            value={emailValue}
            onTextChange={handleEmailInputChange}
            onFieldBlur={handleEmailFieldBlur}
            rawErrors={emailErrorMsg}
          />
        </div>

        {/* Phone number */}
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="phoneNumber"
            labelText={t("phoneNumber")}
            description={t("phoneNumberHint")}
            isRequired={true}
            fieldMaxLength={14}
            value={phone}
            onTextChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            onFieldBlur={handlePhoneFieldBlur}
            rawErrors={phoneErrorMsg}
          />
        </div>
      </div>
    </div>
  );
}
