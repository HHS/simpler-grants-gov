import { getSession } from "src/services/auth/session";
import { UnauthorizedError } from "src/errors";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import Breadcrumbs from "src/components/Breadcrumbs";
import { fetchUserAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { CreateOpportunityForm } from "src/components/opportunities/create/CreateOpportunityForm";
import { KeyValuePair } from "src/components/opportunities/create/CreateOpportunityFormFields";

import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { Alert, GridContainer} from "@trussworks/react-uswds";


// Error Message for failed backend calls on page load 
const ErrorMsgWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("CreateOpportunity");
  return (
    <GridContainer>
      <h1 classNameName="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
      {children}
    </GridContainer>
  );
};
const PageErrorMessage = () => {
  const t = useTranslations("CreateOpportunity");
  return (
    <ErrorMsgWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("errorMessage")}
        </Alert>
      </div>
    </ErrorMsgWrapper>
  );
};

// Page Header component
const PageHeader = () => {
  const t = useTranslations("CreateOpportunity");
  return (
    <>
      <Breadcrumbs
        breadcrumbList={[
          { title: "home", path: "/" },
          {
            title: "Opportunities",
            path: `/opportunities`,
          },
          {
            title: "Create",
            path: `/opportunities/create`,
          },
        ]}
      />

      <h1>{t("pageTitle")}</h1>
      <h2>{ t("keyInfo")}</h2>
      <div className="display-flex flex-justify">
        <div>
          {t("basicInstructions")}
        </div>
      </div>
    </>
  );
};


// --- Main Page ---
interface formPageProps {
  params: Promise<{ agencyId: string; locale: string }>;
}
async function FormPage({ params }: formPageProps) {
  const { agencyId } = await params;
  const userSession = await getSession();

  // Check the user's session
  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }

  // Get agencies
  let defaultAgencyId = "";
  let userAgencies: RelevantAgencyRecord[];
  try {
    userAgencies = await fetchUserAgencies();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <PageErrorMessage />;
  }
  // Agencies: sort alphabetically, convert to key-value pairs, set the default
  const sortedAgencies = [...userAgencies].sort((a, b) =>
    a.agency_name.localeCompare(b.agency_name)
  );
  const mapAgencyToKeyValuePair = (agency: RelevantAgencyRecord): KeyValuePair => ({
    key: agency.agency_id.toString(), // Example mapping
    value: agency.agency_name,
  });
  const keyValueList: KeyValuePair[] = sortedAgencies.map(mapAgencyToKeyValuePair);
  // const keyValueList: KeyValuePair[] = sortedAgencies.map(agency => ({
  //   key: agency.agency_id,
  //   value: agency.agency_name,
  // }));
  keyValueList.forEach((item) => {
    if (item.key === agencyId) {
      defaultAgencyId = agencyId;
    }
  })

  return (
    <>
      <GridContainer>
        <PageHeader/>
        <CreateOpportunityForm
          defaultAgencyId={defaultAgencyId}
          userAgencies={keyValueList}
        />
      </GridContainer>
    </>
  );

}


export default withFeatureFlag<formPageProps, never>(
  FormPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
