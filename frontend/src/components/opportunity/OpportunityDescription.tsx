import DOMPurify from "isomorphic-dompurify";
import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

type Props = {
  opportunityData: Opportunity;
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

const eligibleApplicantsFormatter = (applicant_types: string[]) => {
  return applicant_types.map((type, index) => {
    if (type in ApplicantType) {
      return <p key={index}>{ApplicantType[type as ApplicantTypeKey]}</p>;
    }
    return <p key={index}>{type}</p>;
  });
};

const OpportunityDescription = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.description");
  const agency_phone_number_stripped = opportunityData.summary
    .agency_phone_number
    ? opportunityData.summary.agency_phone_number.replace(/-/g, "")
    : "";

  const additionalInformationOnEligibility = opportunityData.summary
    .applicant_eligibility_description
    ? opportunityData.summary.applicant_eligibility_description
    : "--";
  const agency_email = opportunityData.summary.agency_email_address
    ? opportunityData.summary.agency_email_address
    : "";
  return (
    <>
      <div className="usa-prose">
        <h2>{t("description")}</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              opportunityData.summary.summary_description
                ? opportunityData.summary.summary_description
                : "",
            ),
          }}
        />
        <h2>{t("eligible_applicants")}</h2>
        {eligibleApplicantsFormatter(opportunityData.summary.applicant_types)}
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
              opportunityData.summary.agency_contact_description
                ? opportunityData.summary.agency_contact_description
                : "",
            ),
          }}
        />
        <p>{agency_email}</p>
        <p>
          <a href={`mailto:${agency_email}`}>
            {opportunityData.summary.agency_email_address_description}
          </a>
        </p>
        <p>
          <a href={`tel:${agency_phone_number_stripped}`}>
            {opportunityData.summary.agency_phone_number}
          </a>
        </p>
      </div>
    </>
  );
};

export default OpportunityDescription;
