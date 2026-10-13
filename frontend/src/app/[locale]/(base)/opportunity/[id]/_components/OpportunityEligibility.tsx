import DOMPurify from "isomorphic-dompurify";
import { eligibilityOptions } from "src/constants/searchFilterOptions";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { getFilterOptionLabel } from "src/utils/search/filterUtils";

import { useTranslations } from "next-intl";

import {
  ADDITIONAL_ELIGIBILITY_INFO_ID,
  isCloseDateMissing,
  SECTION_HEADING_CLASSES,
} from "./OpportunityDetailItem";

// page specific grouping from the opportunity page design. The shared eligibilityTypes
// groups are used by search and the grantor forms, so they are intentionally not reused here
export const ELIGIBILITY_GROUPS = [
  {
    key: "forProfit",
    applicantTypes: [
      "for_profit_organizations_other_than_small_businesses",
      "small_businesses",
    ],
  },
  {
    key: "education",
    applicantTypes: [
      "independent_school_districts",
      "public_and_state_institutions_of_higher_education",
      "private_institutions_of_higher_education",
    ],
  },
  {
    key: "government",
    applicantTypes: [
      "state_governments",
      "county_governments",
      "city_or_township_governments",
      "special_district_governments",
    ],
  },
  {
    key: "nativeAmerican",
    applicantTypes: [
      "federally_recognized_native_american_tribal_governments",
      "other_native_american_tribal_organizations",
      "public_and_indian_housing_authorities",
    ],
  },
  {
    key: "nonprofit",
    applicantTypes: [
      "nonprofits_non_higher_education_with_501c3",
      "nonprofits_non_higher_education_without_501c3",
    ],
  },
  {
    key: "miscellaneous",
    applicantTypes: ["individuals", "other", "unrestricted"],
  },
] as const;

export const applicantTypesToGroups = (applicantTypes: string[]) =>
  ELIGIBILITY_GROUPS.map(({ key, applicantTypes: groupApplicantTypes }) => ({
    key,
    labels: applicantTypes
      .filter((applicantType) =>
        (groupApplicantTypes as readonly string[]).includes(applicantType),
      )
      .map((applicantType) =>
        getFilterOptionLabel(applicantType, eligibilityOptions),
      )
      .filter(Boolean),
  })).filter(({ labels }) => labels.length > 0);

const EligibleApplicants = ({
  applicantTypes,
}: {
  applicantTypes: string[];
}) => {
  const t = useTranslations("OpportunityListing.eligibility");
  const notAvailable = useTranslations("OpportunityListing")("notAvailable");
  const groups = applicantTypesToGroups(applicantTypes);

  if (!groups.length) {
    return <p>{notAvailable}</p>;
  }

  return (
    <ul className="usa-list usa-list--unstyled padding-left-3">
      {groups.map(({ key, labels }) => (
        <li key={key} className="margin-bottom-2">
          <span className="text-bold">{t(`groups.${key}`)}:</span>
          <ul className="usa-list margin-top-1">
            {labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

const OpportunityEligibility = ({
  opportunityData,
}: {
  opportunityData: Pick<OpportunityDetail, "opportunity_status" | "summary">;
}) => {
  const t = useTranslations("OpportunityListing.eligibility");
  const { summary } = opportunityData;
  // without a close date, its description belongs here instead of under important dates
  const closeDateDescription = isCloseDateMissing(opportunityData)
    ? summary.close_date_description
    : null;

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      <EligibleApplicants applicantTypes={summary.applicant_types || []} />
      <h3
        id={ADDITIONAL_ELIGIBILITY_INFO_ID}
        className="simpler-page-anchor-offset font-sans-md"
      >
        {t("additionalInfo")}
      </h3>
      {summary.applicant_eligibility_description ? (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              summary.applicant_eligibility_description,
            ),
          }}
        />
      ) : (
        <p>{t("noAdditionalInfo")}</p>
      )}
      {closeDateDescription && (
        <p>
          <strong>{t("closeDateDescription")}:</strong> {closeDateDescription}
        </p>
      )}
    </div>
  );
};

export default OpportunityEligibility;
