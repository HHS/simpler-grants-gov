// --------------------------------------------------
// Components for the Opportunity List page
// --------------------------------------------------
import { UserAgency } from "src/services/fetch/fetchers/userAgenciesFetcher";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
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

export const NoStartedOpportunities = () => {
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

export const OpportunitiesErrorPage = () => {
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

export const AgencyNotAuthorizedPage = ({
  agencies,
}: {
  agencies: UserAgency[];
}) => {
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

export const AgencyNotAuthorizedMessage = () => {
  const t = useTranslations("Opportunities");
  return (
    <div className="margin-bottom-15">
      <div className="font-sans-xl text-bold margin-bottom-3">
        {t("agencyNotAuthorized")}
      </div>
    </div>
  );
};

export const NoAgenciesPage = () => {
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
  const t = useTranslations("Opportunities.actionButtons");
  return canUpdate ? (
    <span>
      <a href={`/opportunity/${opportunityId}/edit`}>{t("edit")}</a>
    </span>
  ) : (
    <span>{t("edit")}</span>
  );
};

const transformTableRowData = (
  userOpportunities: BaseOpportunity[],
  canUpdate: boolean,
  _t: TFn,
) => {
  return userOpportunities.map((opportunity: BaseOpportunity) => {
    const t = useTranslations("Opportunities.actionButtons");
    const status = opportunity.is_draft
      ? "Draft"
      : opportunity.opportunity_status;
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
        cellData: status,
      },
      {
        cellData: opportunity.is_draft ? (
          <span>
            <EditAction
              canUpdate={canUpdate}
              opportunityId={opportunity.opportunity_id}
            />
            , {t("copy")}, {t("delete")}
          </span>
        ) : (
          "" // Don't show any actions for published opportunities
        ),
      },
    ];
  });
};

export const OpportunitiesHeader = ({
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
  const showOpportunities = currentAgencyId != "" ? true : false;

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

export const OpportunitiesTable = ({
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
