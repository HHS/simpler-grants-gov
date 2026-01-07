import { ExternalRoutes } from "src/constants/routes";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";

export const StartApplicationDescription = ({
  organizations,
  applicantTypes,
}: {
  organizations: UserOrganization[];
  applicantTypes: ApplicantTypes[];
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.description",
  );
  // individual
  if (!applicantTypes.includes("organization")) {
    return;
  }
  // ineligible
  if (!organizations.length && !applicantTypes.includes("individual")) {
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
        <p>
          {t.rich("pilotGoToGrants", {
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
        <p>{t("organizationIndividualIntro")}</p>
        <ul>
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
      </div>
    );
  }
  // organization
  return (
    <div>
      <p>{t("pilotIntro")}</p>
      <p>{t("organizationApply")}</p>
      <ul>
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
        {t.rich("support", {
          link: (chunk) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://grants.gov"
            >
              {chunk}
            </a>
          ),
          email: (chunk) => (
            <a href={`mailto:${ExternalRoutes.EMAIL_SIMPLERGRANTSGOV}`}>
              {chunk}
            </a>
          ),
          telephone: (chunk) => <a href="tel:18005814726">{chunk}</a>,
        })}
      </p>
    </div>
  );
};
