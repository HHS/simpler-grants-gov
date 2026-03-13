import { getSession } from "src/services/auth/session";
import { UnauthorizedError } from "src/errors";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import Breadcrumbs from "src/components/Breadcrumbs";
import { fetchUserAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { CreateOpportunityPage1 } from "src/components/opportunities/create/CreateOpportunityPage1";

import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
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
  const pageTitle = t("pageTitle");
  const infoTitle = t("keyInfo");
  const infoText = t("basicInstructions");
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

      <h1>{pageTitle}</h1>
      <h2>{infoTitle}</h2>
      <div className="display-flex flex-justify">
        <div>
          {infoText}
        </div>
      </div>
    </>
  );
};


// Main Page 
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

  // Get the user's agencies
  let userAgencies: RelevantAgencyRecord[];
  try {
    userAgencies = await fetchUserAgencies();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <PageErrorMessage />;
  }

  return (
    <>
      <GridContainer>
        <PageHeader/>
        <CreateOpportunityPage1
          agencyId={agencyId}
          userAgencies={userAgencies}
        />
      </GridContainer>
    </>
  );

}


export default withFeatureFlag<formPageProps, never>(
  FormPage,
  "createOpportunityOff",
  () => redirect("/maintenance"),
);
