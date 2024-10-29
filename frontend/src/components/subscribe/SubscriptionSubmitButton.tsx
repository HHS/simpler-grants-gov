"use client";

import { useFormStatus } from "react-dom";

import { useTranslations } from "next-intl";
import React from "react";
import { Button } from "@trussworks/react-uswds";

export function SubscriptionSubmitButton() {
  // Note: This was split out into seperate component so that it can be disabled when the form is pending
  // useFormStatus requires being a child of a form.
  const { pending } = useFormStatus();

  const t = useTranslations("Subscribe");

  return (
    <Button
      disabled={pending}
      type="submit"
      name="submit"
      id="submit"
      className="margin-top-4 margin-bottom-1"
    >
      {t("form.button")}
    </Button>
  );
}
