import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { Organization } from "src/types/UserTypes";

import { useTranslations } from "next-intl";

export const StartApplicationDescription = ({
  organizations,
  applicantTypes,
}: {
  organizations: Organization[];
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
          <li>{t("poc")}</li>
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
          <li>{t("poc")}</li>
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
      <p>{t("organizationIntro")}</p>
      <ul>
        <li>{t("poc")}</li>
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
        {t.rich("goToGrants", {
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
};
