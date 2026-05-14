"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ErrorMessage,
  FormGroup,
  Label,
  TextInput,
} from "@trussworks/react-uswds";

import { SubscriptionSubmitButton } from "./SubscriptionSubmitButton";

export type ValidationErrors = {
  name?: string[];
  email?: string[];
};

type FormState = {
  errorMessage: React.ReactNode;
  validationErrors: ValidationErrors;
};

export default function SubscriptionForm() {
  const t = useTranslations("Subscribe");
  const router = useRouter();

  const [state, setState] = useState<FormState>({
    errorMessage: "",
    validationErrors: {},
  });

  const showError = (fieldName: string): boolean => {
    if (!state?.validationErrors) return false;

    return (
      state?.validationErrors[fieldName as keyof ValidationErrors] !== undefined
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      success: boolean;
      errorCode?: string;
      validationErrors?: ValidationErrors;
    };

    if (data.success) {
      router.push("/newsletter/confirmation");
      return;
    }

    if (data.validationErrors) {
      setState({ errorMessage: "", validationErrors: data.validationErrors });
      return;
    }

    if (data.errorCode === "alreadySubscribed") {
      setState({
        errorMessage: t("errors.alreadySubscribed"),
        validationErrors: {},
      });
    } else {
      setState({
        errorMessage: t.rich("errors.server", {
          "email-link": (content) => (
            <a href="mailto:simpler@grants.gov">{content}</a>
          ),
        }),
        validationErrors: {},
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup error={showError("name")}>
        <Label htmlFor="name" className="maxw-full">
          {t("form.name") + " "}
          <span title="required" className="usa-hint usa-hint--required">
            ({t("form.req")})
          </span>
        </Label>
        {showError("name") ? (
          <ErrorMessage className="maxw-mobile-lg">
            {state?.validationErrors.name?.[0]}
          </ErrorMessage>
        ) : (
          <></>
        )}
        <TextInput
          aria-required
          type="text"
          name="name"
          id="name"
          className="maxw-full"
        />
      </FormGroup>
      <Label htmlFor="LastName" className="maxw-full">
        {t("form.lastName") + " "}
        <span title="optional" className="usa-hint usa-hint--optional ">
          ({t("form.opt")})
        </span>
      </Label>
      <TextInput
        type="text"
        name="LastName"
        id="LastName"
        className="maxw-full"
      />
      <FormGroup error={showError("email")}>
        <Label htmlFor="email" className="maxw-full">
          {t("form.email") + " "}
          <span title="required" className="usa-hint usa-hint--required ">
            ({t("form.req")})
          </span>
        </Label>
        {showError("email") ? (
          <ErrorMessage className="maxw-mobile-lg">
            {state?.validationErrors.email?.[0]}
          </ErrorMessage>
        ) : (
          <></>
        )}
        <TextInput
          aria-required
          type="email"
          name="email"
          id="email"
          className="maxw-full"
        />
      </FormGroup>
      <div className="display-none">
        <Label htmlFor="hp">HP</Label>
        <TextInput type="text" name="hp" id="hp" />
      </div>
      <SubscriptionSubmitButton />
      {state?.errorMessage ? (
        <ErrorMessage className="maxw-mobile-lg">
          {state?.errorMessage}
        </ErrorMessage>
      ) : (
        <></>
      )}
    </form>
  );
}
