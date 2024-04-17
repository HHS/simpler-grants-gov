import type { GetStaticProps, NextPage } from "next";
import {
  NEWSLETTER_CONFIRMATION,
  NEWSLETTER_CRUMBS,
} from "src/constants/breadcrumbs";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Alert,
  Button,
  ErrorMessage,
  FormGroup,
  Grid,
  GridContainer,
  Label,
  TextInput,
} from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "../../components/BetaAlert";
import { Data } from "../api/subscribe";

const Newsletter: NextPage = () => {
  const { t } = useTranslation("common");
  const beta_strings = {
    alert_title: t("Beta_alert.alert_title"),
    alert: t("Beta_alert.alert")
  };
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
      return "Newsletter.errors.missing_name";
    if (fieldName === "email" && formData.email === "")
      return "Newsletter.errors.missing_email";
    if (fieldName === "email" && !emailRegex.test(formData.email))
      return "Newsletter.errors.invalid_email";
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
      await router.push({
        pathname: NEWSLETTER_CONFIRMATION.path,
        query: { sendy: message },
      });
      return setSendyError("");
    } else {
      const { error }: Data = (await res.json()) as Data;
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
    <>
      <PageSEO title={t("Newsletter.page_title")} description={t("Newsletter.meta_description")} />
      <BetaAlert beta_strings={beta_strings} />
      <Breadcrumbs breadcrumbList={NEWSLETTER_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("Newsletter.title")}
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl margin-bottom-0">
          {t("Newsletter.intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p className="usa-intro">{t("Newsletter.paragraph_1")}</p>
            <Trans
              t={t}
              i18nKey="list"
              components={{
                ul: (
                  <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4" />
                ),
                li: <li />,
              }}
            />
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
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
                  <Trans
                    t={t}
                    i18nKey={
                      sendyError === "Already subscribed."
                        ? "errors.already_subscribed"
                        : "errors.sendy"
                    }
                    values={{
                      sendy_error: sendyError,
                      email_address: erroredEmail,
                    }}
                    components={{
                      email: (
                        <a
                          href={`mailto:${email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  />
                </Alert>
              ) : (
                <></>
              )}
              <FormGroup error={showError("name")}>
                <Label htmlFor="name">
                  First Name{" "}
                  <span
                    title="required"
                    className="usa-hint usa-hint--required "
                  >
                    (required)
                  </span>
                </Label>
                {showError("name") ? (
                  <ErrorMessage className="maxw-mobile-lg">
                    {t(validateField("name"))}
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
                  <span
                    title="required"
                    className="usa-hint usa-hint--required "
                  >
                    (required)
                  </span>
                </Label>
                {showError("email") ? (
                  <ErrorMessage className="maxw-mobile-lg">
                    {t(validateField("email"))}
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
              <Button
                type="submit"
                name="submit"
                id="submit"
                className="margin-top-4"
              >
                Subscribe
              </Button>
            </form>
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
      </GridContainer>
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Newsletter;
