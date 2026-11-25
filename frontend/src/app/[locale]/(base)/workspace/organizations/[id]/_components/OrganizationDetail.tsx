import { OrganizationInfo } from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationInfo";
import {
  OrganizationRoster,
  OrganizationRosterSkeleton,
} from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationRoster";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData } from "src/types/authTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";

export const OrganizationDetail = ({
  organizationId,
  authorizedData,
  externalCollaboratorsEnabled = false,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
  externalCollaboratorsEnabled?: boolean;
}) => {
  const t = useTranslations("OrganizationDetail");
  if (!authorizedData) {
    throw new Error("OrganizationDetail must be wrapped in AuthorizationGate");
  }
  const { fetchedResources } = authorizedData;
  const {
    organizationDetails: { data, error },
  } = fetchedResources;

  if (error || !data) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("fetchError")}</ErrorMessage>
      </GridContainer>
    );
  }
  const { sam_gov_entity } = data as Organization;
  return (
    <GridContainer>
      <Breadcrumbs
        breadcrumbList={[
          {
            title: t("breadcrumbWorkspace"),
            path: `/workspace`,
          },
          {
            title: t("breadcrumbOrganizations"),
            path: `/workspace/organizations`,
          },
          {
            title: sam_gov_entity.legal_business_name,
          },
        ]}
      />
      <h1 className="margin-top-0">{sam_gov_entity.legal_business_name}</h1>
      <OrganizationInfo organizationDetails={sam_gov_entity} />
      <Suspense
        fallback={
          <OrganizationRosterSkeleton
            organizationId={organizationId}
            showExternal={externalCollaboratorsEnabled}
          />
        }
      >
        <OrganizationRoster
          organizationId={organizationId}
          showExternal={externalCollaboratorsEnabled}
        />
      </Suspense>
    </GridContainer>
  );
};
