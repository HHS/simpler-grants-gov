"use client";

import { useTranslations } from "next-intl";
import React, { ChangeEvent, useState } from "react";

import {
  CommonCharacterCount,
  CommonTextInput,
} from "src/components/core/forms/CommonFormFields";

export function AgencyContact() {
  const t = useTranslations("OpportunityCompetition.sectionAgencyContact");

  //--- Validation for Email Address ---
  const [emailValue, setEmailValue] = useState<string>("");
  const [hasEmailError, setHasEmailError] = useState<boolean>(false);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string[]>([]);
  // Production-grade email layout validation regex
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // A. Maintain input state changes
  const handleEmailInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEmailValue(e.target.value);

    // Proactively clear error states as the user types
    if (hasEmailError) {
      setHasEmailError(false);
      setEmailErrorMsg([]);
    }
  };

  // B. Validate on exit (onBlur) using the regular expression
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

  //--- Special formatting for Phone Number ---
  const [phone, setPhone] = useState<string>("");

  // A. Prevent non-numeric characters from being typed on PC keyboards
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

  // B. Format the numbers and safeguard against pasted content
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

    setPhone(formattedValue);
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
            onTextChange={() => {}}
            defaultValue=""
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
            onTextChange={handleEmailInputChange}
            onFieldBlur={handleEmailFieldBlur}
            value={emailValue}
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
            onTextChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            value={phone}
          />
        </div>
      </div>
    </div>
  );
}
