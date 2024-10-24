import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

type Props = {
  summary: Summary;
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
    return <p>--</p>;
  }
  return applicantTypes.map((type, index) => {
    if (type in ApplicantType) {
      return <p key={index}>{ApplicantType[type as ApplicantTypeKey]}</p>;
    }
    return <p key={index}>{type}</p>;
  });
};

const OpportunityDescription = ({ summary }: Props) => {
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
  return (
    <>
      <div className="usa-prose">
        <h2>{t("description")}</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(summary.summary_description ?? "--"),
          }}
        />
        <h2>{t("eligible_applicants")}</h2>
        {eligibleApplicantsFormatter(summary.applicant_types)}
        <h3>{t("additional_info")}</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(additionalInformationOnEligibility),
          }}
        />
        <h2>{t("contact_info")}</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              summary?.agency_contact_description || "--",
            ),
          }}
        />
        <h3>{t("email")}</h3>
        {summary?.agency_email_address_description && (
          <p>{summary.agency_email_address_description}</p>
        )}
        <p>{agencyEmailLink}</p>
        <h3>{t("telephone")}</h3>
        <p>{telephoneLink}</p>
      </div>
    </>
  );
};

export default OpportunityDescription;
