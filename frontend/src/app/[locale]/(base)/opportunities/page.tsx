import { UnauthorizedError } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import {
  fetchUserAgencies,
  UserAgency,
} from "src/services/fetch/fetchers/userAgenciesFetcher";
import { LocalizedPageProps, TFn } from "src/types/intl";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";
import { AgencySelector } from "src/components/workspace/AgencySelector";

type OpportunitiesListProps = LocalizedPageProps & WithFeatureFlagProps;

const OpportunitiesPageWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("Opportunities");
  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
      {children}
    </GridContainer>
  );
};

const NoStartedOpportunities = () => {
  const t = useTranslations("Opportunities.noOpportunitiesMessage");

  return (
    <div className="margin-bottom-15">
      <div className="font-sans-xl text-bold margin-bottom-3">
        {t("primary")}
      </div>
      <div>{t("secondary")}</div>
    </div>
  );
};

const OpportunitiesErrorPage = () => {
  const t = useTranslations("Opportunities");

  return (
    <OpportunitiesPageWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("errorMessage")}
        </Alert>
      </div>
    </OpportunitiesPageWrapper>
  );
};

const AgencyNotAuthorizedPage = () => {
  const t = useTranslations("Opportunities");

  return (
    <OpportunitiesPageWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("agencyNotAuthorized")}
        </Alert>
      </div>
    </OpportunitiesPageWrapper>
  );
};

const NoAgenciesPage = () => {
  const t = useTranslations("Opportunities");

  return (
    <OpportunitiesPageWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("noAgencies")}
        </Alert>
      </div>
    </OpportunitiesPageWrapper>
  );
};

const transformTableRowData = (
  userOpportunities: BaseOpportunity[],
  _t: TFn,
) => {
  return userOpportunities.map((opportunity: BaseOpportunity) => {
    return [
      { cellData: opportunity.agency_name },
      {
        cellData: (
          <a href={`/opportunity/${opportunity.opportunity_id}`}>
            {opportunity.opportunity_title}
          </a>
        ),
      },
      {
        cellData: opportunity.opportunity_status,
      },
      {
        cellData: "Edit, Copy, Delete",
      },
    ];
  });
};

const OpportunitiesTable = ({
  userOpportunities,
}: {
  userOpportunities: BaseOpportunity[];
}) => {
  const t = useTranslations("Opportunities");

  const headerTitles: TableCellData[] = [
    { cellData: t("tableHeadings.agency") },
    { cellData: t("tableHeadings.title") },
    { cellData: t("tableHeadings.status") },
    { cellData: t("tableHeadings.actions") },
  ];

  return (
    <div>
      <span className="font-sans-lg text-bold">
        {t("numOpportunities", { num: userOpportunities.length })}
      </span>

      <TableWithResponsiveHeader
        headerContent={headerTitles}
        tableRowData={transformTableRowData(userOpportunities, t)}
      />
    </div>
  );
};

async function OpportunitiesListPage(props: OpportunitiesListProps) {
  const { searchParams } = props;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedAgencyId = resolvedSearchParams.agency;

  let userAgencies: UserAgency[];
  try {
    userAgencies = await fetchUserAgencies();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <OpportunitiesErrorPage />;
  }

  if (!userAgencies.length) {
    return <NoAgenciesPage />;
  }

  if (!selectedAgencyId) {
    redirect(`?agency=${userAgencies[0].agency_id}`);
  }

  const selectedAgency = userAgencies.find(
    (a) => a.agency_id === selectedAgencyId,
  );

  if (!selectedAgency) {
    return <AgencyNotAuthorizedPage />;
  }

  const opportunitySearchParams = convertSearchParamsToProperTypes({
    agency: selectedAgency.agency_code,
  });

  let userOpportunities: BaseOpportunity[];
  try {
    userOpportunities = (await searchForOpportunities(opportunitySearchParams))
      .data;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <OpportunitiesErrorPage />;
  }

  return (
    <OpportunitiesPageWrapper>
      {userAgencies.length > 1 && (
        <AgencySelector
          agencies={userAgencies}
          currentAgencyId={selectedAgencyId}
        />
      )}
      {userOpportunities.length ? (
        <OpportunitiesTable userOpportunities={userOpportunities} />
      ) : (
        <NoStartedOpportunities />
      )}
    </OpportunitiesPageWrapper>
  );
}

export default withFeatureFlag<OpportunitiesListProps, never>(
  OpportunitiesListPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
