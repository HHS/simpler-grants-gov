import TopLevelError from "src/app/[locale]/(base)/error/page";
import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { searchOpportunitiesByAgency } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import {
  fetchUserAgencies,
  UserAgency,
} from "src/services/fetch/fetchers/userAgenciesFetcher";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";
import {
  checkRequiredPrivileges,
  UserPrivilegeRequest,
  UserPrivilegeResult,
} from "src/utils/userPrivileges";

import { redirect } from "next/navigation";

import {
  AgencyNotAuthorizedMessage,
  AgencyNotAuthorizedPage,
  NoAgenciesPage,
  NoStartedOpportunities,
  OpportunitiesErrorPage,
  OpportunitiesHeader,
  OpportunitiesPageWrapper,
  OpportunitiesTable,
} from "src/components/opportunities/OpportunityListComponents";

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
type OpportunitiesListProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
async function OpportunitiesListPage({ searchParams }: OpportunitiesListProps) {
  const resolvedSearchParams = await searchParams;
  const selectedAgencyParam = resolvedSearchParams?.agency;
  const selectedAgencyId = Array.isArray(selectedAgencyParam)
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
      userSession.token,
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
        userSession.token,
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
