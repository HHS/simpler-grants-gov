import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData } from "src/types/authTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { OrganizationInfo } from "src/components/organization/OrganizationInfo";
import {
  OrganizationRoster,
  OrganizationRosterSkeleton,
} from "src/components/organization/OrganizationRoster";

export const OrganizationDetail = ({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
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
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{sam_gov_entity.legal_business_name}</h1>
      <OrganizationInfo organizationDetails={sam_gov_entity} />
      <Suspense
        fallback={
          <OrganizationRosterSkeleton organizationId={organizationId} />
        }
      >
        <OrganizationRoster organizationId={organizationId} />
      </Suspense>
    </GridContainer>
  );
};
