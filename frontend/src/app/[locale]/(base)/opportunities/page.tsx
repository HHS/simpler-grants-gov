import TopLevelError from "src/app/[locale]/(base)/error/page";
import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { searchOpportunitiesByAgency } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import {
  fetchUserAgencies,
  UserAgency,
} from "src/services/fetch/fetchers/userAgenciesFetcher";
import { LocalizedPageProps, TFn } from "src/types/intl";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";
import {
  checkRequiredPrivileges,
  UserPrivilegeRequest,
  UserPrivilegeResult,
} from "src/utils/userPrivileges";

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

export const OpportunitiesPageWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("Opportunities");
  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
      {children}
    </GridContainer>
  );
};

// --------------------------------------------------
// Components or this page
// --------------------------------------------------

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

const AgencyNotAuthorizedPage = ({ agencies }: { agencies: UserAgency[] }) => {
  const t = useTranslations("Opportunities");
  return (
    <OpportunitiesPageWrapper>
      <div className="margin-bottom-5">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("agencyNotAuthorized")}
        </Alert>
      </div>
      <OpportunitiesHeader
        userOpportunitiesCount={0}
        agencyName={""}
        agencies={agencies}
        currentAgencyId={""}
        isSingleAgency={false}
        canCreate={false}
      />
    </OpportunitiesPageWrapper>
  );
};

const AgencyNotAuthorizedMessage = () => {
  const t = useTranslations("Opportunities");
  return (
    <div className="margin-bottom-15">
      <div className="font-sans-xl text-bold margin-bottom-3">
        {t("agencyNotAuthorized")}
      </div>
    </div>
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

const EditAction = ({
  canUpdate,
  opportunityId,
}: {
  canUpdate: boolean;
  opportunityId: string;
}) => {
  const t = useTranslations("Opportunities");
  return canUpdate ? (
    <span>
      <a href={`/opportunity/${opportunityId}/edit`}>
        {t("actionButtons.edit")}
      </a>
    </span>
  ) : (
    <span>{t("actionButtons.edit")}</span>
  );
};

const transformTableRowData = (
  userOpportunities: BaseOpportunity[],
  canUpdate: boolean,
  _t: TFn,
) => {
  return userOpportunities.map((opportunity: BaseOpportunity) => {
    const status = opportunity.is_draft
      ? "Draft"
      : opportunity.opportunity_status;
    const opportunityTitleUrl = opportunity.is_draft
      ? canUpdate
        ? `/opportunity/${opportunity.opportunity_id}/edit`
        : ``
      : `/opportunity/${opportunity.opportunity_id}`;
    return [
      { cellData: opportunity.agency_name },
      {
        cellData: opportunityTitleUrl ? (
          <a href={opportunityTitleUrl}>{opportunity.opportunity_title}</a>
        ) : (
          <span>{opportunity.opportunity_title}</span>
        ),
      },
      {
        cellData: status,
      },
      {
        cellData: opportunity.is_draft ? (
          <span>
            <EditAction
              canUpdate={canUpdate}
              opportunityId={opportunity.opportunity_id}
            />
            , {_t("actionButtons.copy")}, {_t("actionButtons.delete")}
          </span>
        ) : (
          "" // Don't show any actions for published opportunities
        ),
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
  canCreate,
}: {
  userOpportunitiesCount: number;
  agencyName: string;
  agencies: UserAgency[];
  currentAgencyId: string;
  isSingleAgency: boolean;
  canCreate: boolean;
}) => {
  const t = useTranslations("Opportunities");
  const showOpportunities = currentAgencyId !== "";

  return (
    <div className="display-flex flex-column gap-3 margin-bottom-4">
      {showOpportunities && (
        <div className="font-sans-lg text-bold">
          {t("numOpportunities", { num: userOpportunitiesCount })}
        </div>
      )}
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
        {canCreate && (
          <Link
            href={`/opportunities/create?agency=${currentAgencyId}`}
            className="usa-button margin-left-auto"
          >
            {t("createOpportunityButton")}
          </Link>
        )}
      </div>
    </div>
  );
};

const OpportunitiesTable = ({
  userOpportunities,
  canUpdate,
}: {
  userOpportunities: BaseOpportunity[];
  canUpdate: boolean;
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
      tableRowData={transformTableRowData(userOpportunities, canUpdate, t)}
    />
  );
};

// --------------------------------------------------
// Utility functions for the Agency User's Privileges
// --------------------------------------------------
type AgencyUserPrivileges = {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
};
const getUserPrivilegeDefinition = (
  agencyId: string,
): UserPrivilegeRequest[] => {
  return [
    {
      resourceId: agencyId,
      resourceType: "agency",
      privilege: "view_opportunity",
    },
    {
      resourceId: agencyId,
      resourceType: "agency",
      privilege: "update_opportunity",
    },
    {
      resourceId: agencyId,
      resourceType: "agency",
      privilege: "create_opportunity",
    },
  ];
};

const parseUserPrivileges = (
  userPrivilegeResult: UserPrivilegeResult[],
): AgencyUserPrivileges => {
  const agencyUserPrivileges: AgencyUserPrivileges = {
    canView: false,
    canCreate: false,
    canUpdate: false,
  };
  if (userPrivilegeResult.length > 0) {
    userPrivilegeResult.forEach((result) => {
      if (result.privilege === "view_opportunity" && result.authorized) {
        agencyUserPrivileges.canView = true;
      } else if (
        result.privilege === "update_opportunity" &&
        result.authorized
      ) {
        agencyUserPrivileges.canUpdate = true;
      } else if (
        result.privilege === "create_opportunity" &&
        result.authorized
      ) {
        agencyUserPrivileges.canCreate = true;
      }
    });
  }
  return agencyUserPrivileges;
};

// --------------------------------------------------
// The Main Page
// --------------------------------------------------
type OpportunitiesListProps = LocalizedPageProps & WithFeatureFlagProps;
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

  // A. Check the user's session
  const userSession = await getSession();
  if (!userSession || !userSession.token) {
    return <TopLevelError />;
  }

  // B. Get all Agencies this user belongs to
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

  // C. If no agencyId was in the param, default selection to the first agency
  if (!selectedAgencyId) {
    redirect(`?agency=${sortedUserAgencies[0].agency_id}`);
  }
  const selectedAgency = sortedUserAgencies.find(
    (a) => a.agency_id === selectedAgencyId,
  );
  if (!selectedAgency) {
    return <AgencyNotAuthorizedPage agencies={sortedUserAgencies} />;
  }

  // D. Check the user's privileges for the selected Agency
  let userPrivilegeResult: UserPrivilegeResult[];
  const userPrivilegeDef: UserPrivilegeRequest[] = getUserPrivilegeDefinition(
    selectedAgency.agency_id,
  );
  try {
    userPrivilegeResult = await checkRequiredPrivileges(
      userSession.user_id,
      userPrivilegeDef,
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <OpportunitiesErrorPage />;
  }
  const agencyUserAcccess = parseUserPrivileges(userPrivilegeResult);

  // E. Get the list of opportunities for this agency
  // Note: if the user does not have read_opportunity privilege for this agency,
  // this API will return an error
  let userOpportunities: BaseOpportunity[] = [];
  if (agencyUserAcccess.canView) {
    const pageRequest: PaginationRequestBody = {
      page_offset: 1,
      page_size: 25,
      sort_order: [
        {
          order_by: "opportunity_title",
          sort_direction: "ascending",
        },
      ],
    };
    try {
      userOpportunities = await searchOpportunitiesByAgency(
        selectedAgency.agency_id,
        pageRequest,
      );
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      return <OpportunitiesErrorPage />;
    }
  }

  // F. Render the page
  return (
    <OpportunitiesPageWrapper>
      <OpportunitiesHeader
        userOpportunitiesCount={userOpportunities.length}
        agencyName={selectedAgency.agency_name}
        agencies={sortedUserAgencies}
        currentAgencyId={selectedAgencyId}
        isSingleAgency={sortedUserAgencies.length === 1}
        canCreate={agencyUserAcccess.canCreate}
      />

      {!agencyUserAcccess.canView && <AgencyNotAuthorizedMessage />}
      {agencyUserAcccess.canView && !userOpportunities.length && (
        <NoStartedOpportunities />
      )}

      {agencyUserAcccess.canView && userOpportunities.length > 0 && (
        <OpportunitiesTable
          userOpportunities={userOpportunities}
          canUpdate={agencyUserAcccess.canUpdate}
        />
      )}
    </OpportunitiesPageWrapper>
  );
}

export default withFeatureFlag<OpportunitiesListProps, never>(
  OpportunitiesListPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
