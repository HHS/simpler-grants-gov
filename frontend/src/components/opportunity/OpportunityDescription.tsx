"use client";

import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { splitMarkup } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import { Button, Link } from "@trussworks/react-uswds";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";

type Props = {
  summary: Summary;
  nofoPath: string;
};

enum ApplicantType {
  state_governments = "State governments",
  county_governments = "County governments",
  city_or_township_governments = "City or township governments",
  special_district_governments = "Special district governments",

  independent_school_districts = "Independent school districts",
  public_and_state_institutions_of_higher_education = "Public and state institutions of higher education",
  private_institutions_of_higher_education = "Private institutions of higher education",

  federally_recognized_native_american_tribal_governments = "Federally recognized Native American tribal governments",
  other_native_american_tribal_organizations = "Other Native American tribal organizations",
  public_and_indian_housing_authorities = "Public and Indian housing authorities",

  nonprofits_non_higher_education_with_501c3 = "Nonprofits non-higher education with 501(c)(3)",
  nonprofits_non_higher_education_without_501c3 = "Nonprofits non-higher education without 501(c)(3)",

  individuals = "Individuals",
  for_profit_organizations_other_than_small_businesses = "For-profit organizations other than small businesses",
  small_businesses = "Small businesses",
  other = "Other",
  unrestricted = "Unrestricted",
}

type ApplicantTypeKey = keyof typeof ApplicantType;

const eligibleApplicantsFormatter = (applicantTypes: string[]) => {
  if (!applicantTypes || !applicantTypes.length) {
    return "--";
  }
  return applicantTypes.map((type, index) => {
    if (type in ApplicantType) {
      return <p key={index}>{ApplicantType[type as ApplicantTypeKey]}</p>;
    }
    return <p key={index}>{type}</p>;
  });
};

const SummaryDescriptionDisplay = ({
  summaryDescription = "",
}: {
  summaryDescription: string;
}) => {
  const t = useTranslations("OpportunityListing.description");
  if (summaryDescription?.length < 750) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }

  const purifiedSummary = DOMPurify.sanitize(summaryDescription);

  const { preSplit, postSplit } = splitMarkup(purifiedSummary, 600);

  if (!postSplit) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: preSplit + "...",
        }}
      />
      <ContentDisplayToggle
        showCallToAction={t("show_summary")}
        hideCallToAction={t("hide_summary_description")}
        positionButtonBelowContent={false}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: postSplit,
          }}
        />
      </ContentDisplayToggle>
    </>
  );
};

const OpportunityDescription = ({ summary, nofoPath }: Props) => {
  const t = useTranslations("OpportunityListing.description");
  const agency_phone_number_stripped = summary?.agency_phone_number
    ? summary.agency_phone_number.replace(/-/g, "")
    : "";

  const additionalInformationOnEligibility =
    summary.applicant_eligibility_description ?? "--";
  const agencyEmailLink = summary?.agency_email_address ? (
    <a href={`mailto:${summary.agency_email_address}`}>
      {summary.agency_email_address}
    </a>
  ) : (
    "--"
  );

  const telephoneLink = summary?.agency_phone_number ? (
    <a href={`tel:${agency_phone_number_stripped}`}>
      {summary.agency_phone_number}
    </a>
  ) : (
    "--"
  );

  const downloadNOFO = () => {
    window.open(nofoPath, "_blank")?.focus();
  };

  return (
    <>
      <div className="usa-prose">
        <h2>{t("title")}</h2>
        {nofoPath.length > 0 ? (
          <div className="grid-row flex-justify">
            <Button onClick={downloadNOFO} type="button">
              <span>{t("nofo_download")} </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="usa-icon usa-icon--size-4"
                focusable="false"
                role="img"
                aria-hidden="true"
              >
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
              </svg>
            </Button>
            <Link
              className="flex-align-self-center"
              href={"#opportunity_documents"}
            >
              {t("jump_to_documents")}
            </Link>
          </div>
        ) : null}
        <h3>{t("summary")}</h3>
        <SummaryDescriptionDisplay
          summaryDescription={summary.summary_description || ""}
        />
        <h2>{t("eligibility")}</h2>
        <h3>{t("eligible_applicants")}</h3>
        {eligibleApplicantsFormatter(summary.applicant_types)}
        <h3>{t("additional_info")}</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(additionalInformationOnEligibility),
          }}
        />
        <h2>{t("contact_info")}</h2>
        <h3>{t("description")}</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              summary?.agency_contact_description || "--",
            ),
          }}
        />
        <h4>{t("email")}</h4>
        {summary?.agency_email_address_description && (
          <p>{summary.agency_email_address_description}</p>
        )}
        <p>{agencyEmailLink}</p>
        <h4>{t("telephone")}</h4>
        <p>{telephoneLink}</p>
      </div>
    </>
  );
};

export default OpportunityDescription;
