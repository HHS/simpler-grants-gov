import type { GetStaticProps, NextPage } from "next";
import {
  NEWSLETTER_CONFIRMATION,
  NEWSLETTER_CRUMBS,
} from "src/constants/breadcrumbs";

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
  const { t } = useTranslation("common", { keyPrefix: "Newsletter" });
  const router = useRouter();

  const [formSubmitted, setFormSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    LastName: "",
    email: "",
    hp: "",
  });

  const [sendyError, setSendyError] = useState("");

  const validateField = (fieldName: string) => {
    const emailRegex = new RegExp(/^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/g)
    if (fieldName === 'name' && formData.name === "") return false
    if (fieldName === 'email' && !emailRegex.test(formData.email)) return false
    return true
  }
  
  const showError = (fieldName: string): boolean => formSubmitted && !validateField(fieldName)

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
    if(!validateField('email') || !validateField('name')) return

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
      return setSendyError(error || "");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitted(true)
    submitForm().catch((err) => {
      console.error("catch block", err);
    });
  };

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={NEWSLETTER_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("title")}
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl margin-bottom-0">
          {t("intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p className="usa-intro">{t("paragraph_1")}</p>
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
            <form
              data-testid="sendy-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {sendyError ? (
                <Alert
                  type="error"
                  heading="An error occurred"
                  headingLevel="h3"
                >
                  Your subscription was not successful. {sendyError}
                </Alert>
              ) : (
                <></>
              )}
              <FormGroup error={showError('name')}>
              <Label htmlFor="name">
                First Name{" "}
                <span title="required" className="usa-hint usa-hint--required ">
                  (required)
                </span>
              </Label>
              {showError('name') ? <ErrorMessage>Helpful error message</ErrorMessage> : <></>}
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
              <FormGroup error={showError('email')}>
              <Label htmlFor="email">
                Email{" "}
                <span title="required" className="usa-hint usa-hint--required ">
                  (required)
                </span>
              </Label>
              {showError('email') ? <ErrorMessage>Helpful error message</ErrorMessage> : <></>}
              <TextInput
                aria-required
                type="text"
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
              <input type="hidden" name="list" value="A2zerhEC59Ea6mzTgzdTgw" />
              <input type="hidden" name="subform" value="yes" />
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
