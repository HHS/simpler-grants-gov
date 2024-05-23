"use client";
import { NEWSLETTER_CONFIRMATION } from "src/constants/breadcrumbs";
import { ExternalRoutes } from "src/constants/routes";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Button,
  ErrorMessage,
  FormGroup,
  Label,
  TextInput,
} from "@trussworks/react-uswds";

import { Data } from "src/pages/api/subscribe";
import { useTranslations } from "next-intl";

export default function NewsletterForm() {
  const t = useTranslations("Newsletter");

  const router = useRouter();
  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;

  const [formSubmitted, setFormSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    LastName: "",
    email: "",
    hp: "",
  });

  const [sendyError, setSendyError] = useState("");
  const [erroredEmail, setErroredEmail] = useState("");

  const validateField = (fieldName: string) => {
    // returns the string "valid" or the i18n key for the error message
    const emailRegex =
      /^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/g;
    if (fieldName === "name" && formData.name === "")
      return t("errors.missing_name");
    if (fieldName === "email" && formData.email === "")
      return t("errors.missing_email");
    if (fieldName === "email" && !emailRegex.test(formData.email))
      return t("errors.invalid_email");
    return "valid";
  };

  const showError = (fieldName: string): boolean =>
    formSubmitted && validateField(fieldName) !== "valid";

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue,
    }));
  };

  const submitForm = async () => {
    const formURL = "api/subscribe";
    if (validateField("email") !== "valid" || validateField("name") !== "valid")
      return;

    const res = await fetch(formURL, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const { message } = (await res.json()) as Data;
      router.push(`${NEWSLETTER_CONFIRMATION.path}?sendy=${message as string}`);
      return setSendyError("");
    } else {
      const { error } = (await res.json()) as Data;
      console.error("client error", error);
      setErroredEmail(formData.email);
      return setSendyError(error || "");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitted(true);
    submitForm().catch((err) => {
      console.error("catch block", err);
    });
  };

  return (
    <form data-testid="sendy-form" onSubmit={handleSubmit} noValidate>
      {sendyError ? (
        <Alert
          type="error"
          heading={
            sendyError === "Already subscribed."
              ? "You’re already signed up!"
              : "An error occurred"
          }
          headingLevel="h3"
        >
          {t.rich(
            sendyError === "Already subscribed."
              ? "errors.already_subscribed"
              : "errors.sendy",
            {
              email: (chunks) => (
                <a
                  href={`mailto:${email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
              sendy_error: (chunks) => (
                <a
                  href={`mailto:${sendyError}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
              email_address: (chunks) => (
                <a
                  href={`mailto:${erroredEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            },
          )}
        </Alert>
      ) : (
        <></>
      )}
      <FormGroup error={showError("name")}>
        <Label htmlFor="name">
          First Name{" "}
          <span title="required" className="usa-hint usa-hint--required ">
            (required)
          </span>
        </Label>
        {showError("name") ? (
          <ErrorMessage className="maxw-mobile-lg">
            {validateField("name")}
          </ErrorMessage>
        ) : (
          <></>
        )}
        <TextInput
          aria-required
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleInput}
        />
      </FormGroup>
      <Label htmlFor="LastName" hint=" (optional)">
        Last Name
      </Label>
      <TextInput
        type="text"
        name="LastName"
        id="LastName"
        value={formData.LastName}
        onChange={handleInput}
      />
      <FormGroup error={showError("email")}>
        <Label htmlFor="email">
          Email{" "}
          <span title="required" className="usa-hint usa-hint--required ">
            (required)
          </span>
        </Label>
        {showError("email") ? (
          <ErrorMessage className="maxw-mobile-lg">
            {validateField("email")}
          </ErrorMessage>
        ) : (
          <></>
        )}
        <TextInput
          aria-required
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleInput}
        />
      </FormGroup>
      <div className="display-none">
        <Label htmlFor="hp">HP</Label>
        <TextInput
          type="text"
          name="hp"
          id="hp"
          value={formData.hp}
          onChange={handleInput}
        />
      </div>
      <Button type="submit" name="submit" id="submit" className="margin-top-4">
        Subscribe
      </Button>
    </form>
  );
}
