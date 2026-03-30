import { UnauthorizedError } from "src/errors";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import {
  fetchUserAgencies,
  UserAgency,
} from "src/services/fetch/fetchers/userAgenciesFetcher";
import { OptionalStringDict } from "src/types/generalTypes";
import { LocalizedPageProps, TFn } from "src/types/intl";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";
import { AgencySelector } from "src/components/workspace/AgencySelector";

type OpportunitiesListProps = LocalizedPageProps & {
  searchParams?: Promise<OptionalStringDict>;
};

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

const OpportunitiesHeader = ({
  userOpportunitiesCount,
  agencyName,
  agencies,
  currentAgencyId,
  isSingleAgency,
}: {
  userOpportunitiesCount: number;
  agencyName: string;
  agencies: UserAgency[];
  currentAgencyId: string;
  isSingleAgency: boolean;
}) => {
  const t = useTranslations("Opportunities");

  return (
    <div className="display-flex flex-column gap-3 margin-bottom-4">
      <div className="font-sans-lg text-bold">
        {t("numOpportunities", { num: userOpportunitiesCount })}
      </div>
      <div className="display-flex flex-justify flex-align-end">
        <div className="maxw-mobile-lg width-full">
          {isSingleAgency ? (
            <div className="font-sans-md text-bold line-height-sans-3">
              {t("showingOpportunitiesFor", { agencyName })}
            </div>
          ) : (
            <AgencySelector
              agencies={agencies}
              currentAgencyId={currentAgencyId}
              className="usa-form-group margin-bottom-0"
            />
          )}
        </div>
        <Link
          href={`/opportunities/create/${currentAgencyId}`}
          className="usa-button margin-left-auto"
        >
          {t("createOpportunityButton")}
        </Link>
      </div>
    </div>
  );
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
    <TableWithResponsiveHeader
      headerContent={headerTitles}
      tableRowData={transformTableRowData(userOpportunities, t)}
    />
  );
};

async function OpportunitiesListPage(props: OpportunitiesListProps) {
  const { searchParams } = props;
  const resolvedSearchParams: Record<string, string | string[] | undefined> =
    searchParams ? await searchParams : {};
  const selectedAgencyParam: string | string[] | undefined =
    resolvedSearchParams.agency;
  const selectedAgencyId: string | undefined = Array.isArray(
    selectedAgencyParam,
  )
    ? selectedAgencyParam[0]
    : selectedAgencyParam;

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

  const sortedUserAgencies = [...userAgencies].sort((a, b) =>
    a.agency_name.localeCompare(b.agency_name),
  );

  if (!selectedAgencyId) {
    redirect(`?agency=${sortedUserAgencies[0].agency_id}`);
  }

  const selectedAgency = sortedUserAgencies.find(
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
      <OpportunitiesHeader
        userOpportunitiesCount={userOpportunities.length}
        agencyName={selectedAgency.agency_name}
        agencies={sortedUserAgencies}
        currentAgencyId={selectedAgencyId}
        isSingleAgency={sortedUserAgencies.length === 1}
      />
      {userOpportunities.length ? (
        <OpportunitiesTable userOpportunities={userOpportunities} />
      ) : (
        <NoStartedOpportunities />
      )}
    </OpportunitiesPageWrapper>
  );
}

export default OpportunitiesListPage;
