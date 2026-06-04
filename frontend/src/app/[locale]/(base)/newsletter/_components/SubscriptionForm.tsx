"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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
  errorMessage: ReactNode;
  validationErrors: ValidationErrors;
};

type SubscribeResponse = {
  success: boolean;
  errorCode?: string;
  validationErrors?: ValidationErrors;
};

export default function SubscriptionForm() {
  const t = useTranslations("Subscribe");
  const router = useRouter();
  const { clientFetch } = useClientFetch<SubscribeResponse>(
    "Newsletter subscription failed",
  );

  const [subscribeErrorState, setSubscribeErrorState] = useState<FormState>({
    errorMessage: "",
    validationErrors: {},
  });

  const showError = (fieldName: string): boolean => {
    if (!subscribeErrorState?.validationErrors) return false;

    return (
      subscribeErrorState?.validationErrors[
        fieldName as keyof ValidationErrors
      ] !== undefined
    );
  };

  const serverError = t.rich("errors.server", {
    "email-link": (content) => (
      <a href="mailto:simpler@grants.gov">{content}</a>
    ),
  });

  const handleSubmit = async (event: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Client-side validation — mirrors the API's Zod schema so the API never
    // receives an invalid payload during normal usage.
    const name = (formData.get("name") as string) ?? "";
    const email = (formData.get("email") as string) ?? "";
    const clientValidationErrors: ValidationErrors = {};
    if (!name.trim()) clientValidationErrors.name = ["Please enter a name."];
    if (!email.trim())
      clientValidationErrors.email = ["Please enter an email address."];
    if (Object.keys(clientValidationErrors).length > 0) {
      setSubscribeErrorState({
        errorMessage: "",
        validationErrors: clientValidationErrors,
      });
      return;
    }

    try {
      const data = await clientFetch("/api/newsletter/subscribe", {
        method: "POST",
        body: formData,
      });

      if (data.success) {
        router.push("/newsletter/confirmation");
        return;
      }

      if (data.errorCode === "alreadySubscribed") {
        setSubscribeErrorState({
          errorMessage: t("errors.alreadySubscribed"),
          validationErrors: {},
        });
      } else {
        setSubscribeErrorState({
          errorMessage: serverError,
          validationErrors: {},
        });
      }
    } catch {
      setSubscribeErrorState({
        errorMessage: serverError,
        validationErrors: {},
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <FormGroup error={showError("name")}>
        <Label htmlFor="name" className="maxw-full">
          {t("form.name") + " "}
          <span title="required" className="usa-hint usa-hint--required">
            ({t("form.req")})
          </span>
        </Label>
        {showError("name") ? (
          <ErrorMessage className="maxw-mobile-lg">
            {subscribeErrorState?.validationErrors.name?.[0]}
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
            {subscribeErrorState?.validationErrors.email?.[0]}
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
      {subscribeErrorState?.errorMessage ? (
        <ErrorMessage className="maxw-mobile-lg">
          {subscribeErrorState?.errorMessage}
        </ErrorMessage>
      ) : (
        <></>
      )}
    </form>
  );
}
