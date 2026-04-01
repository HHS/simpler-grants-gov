import TopLevelError from "src/app/[locale]/(base)/error/page";
import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { fetchUserAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { CreateOpportunityForm } from "src/components/opportunities/create/CreateOpportunityForm";

// Error Message for failed backend calls on page load
const ErrorMsgWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("CreateOpportunity");
  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
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
    </>
  );
};

// --- Main Page ---
type CreateOpportunityProps = LocalizedPageProps & WithFeatureFlagProps;


async function CreateOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedAgencyParam = resolvedSearchParams?.agency;
  const agencyId = Array.isArray(selectedAgencyParam)
    ? selectedAgencyParam[0]
    : selectedAgencyParam;
  const { searchParams } = props;
  const resolvedSearchParams: Record<string, string | string[] | undefined> =
    searchParams ? await searchParams : {};
  const selectedAgencyParam: string | string[] | undefined =
    resolvedSearchParams.agency;
  const agencyId: string | undefined = Array.isArray(selectedAgencyParam)
    ? selectedAgencyParam[0]
    : selectedAgencyParam;

  const userSession = await getSession();

  // Check the user's session
  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }

  // Get agencies
  let userAgencies: RelevantAgencyRecord[];
  try {
    userAgencies = await fetchUserAgencies();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <PageErrorMessage />;
  }
  // set the default agency if it's valid
  const defaultAgency = userAgencies.find(
    (agency) => agency.agency_id.toString() === agencyId,
  );
  const defaultAgencyId = defaultAgency?.agency_id.toString() ?? "";
  // convert to key-value list for the combobox
  const mappedAgencies: Record<string, string> = userAgencies.reduce(
    (accumulator, agency) => {
      accumulator[agency.agency_id] = agency.agency_name;
      return accumulator;
    },
    {} as Record<string, string>,
  );

  return (
    <>
      <GridContainer>
        <PageHeader />
        <CreateOpportunityForm
          defaultAgencyId={defaultAgencyId}
          userAgencies={mappedAgencies}
        />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<CreateOpportunityProps, never>(
  CreateOpportunityPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
