import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";

export const StartApplicationDescription = ({
  organizations,
  applicantTypes,
  organizationsError,
}: {
  organizations: UserOrganization[];
  applicantTypes: ApplicantTypes[];
  organizationsError?: boolean;
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.description",
  );
  // individual
  if (!applicantTypes.includes("organization")) {
    return;
  }
  // ineligible (but not if there's an error loading organizations)
  if (
    !organizations.length &&
    !applicantTypes.includes("individual") &&
    !organizationsError
  ) {
    return (
      <div>
        <p>{t("organizationIntro")}</p>
        <ul>
          <li>{t("applyingForOrg")}</li>
          <li>
            {t.rich("uei", {
              link: (chunk) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://sam.gov"
                >
                  {chunk}
                </a>
              ),
            })}
          </li>
        </ul>
        <p>
          {t.rich("ineligibleGoToGrants", {
            link: (chunk) => (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://grants.gov"
              >
                {chunk}
              </a>
            ),
          })}
        </p>
      </div>
    );
  }
  // individual or organization
  if (applicantTypes.length === 2) {
    return (
      <div>
        <p>{t("pilotIntro")}</p>
      </div>
    );
  }
  // organization
  return (
    <div>
      <p>{t("pilotIntro")}</p>
    </div>
  );
};
