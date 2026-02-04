import { UnauthorizedError } from "src/errors";
import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import { LocalizedPageProps, TFn } from "src/types/intl";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/searchUtils";

import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

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

export default async function Opportunities(_props: LocalizedPageProps) {
  const searchParams = convertSearchParamsToProperTypes({});

  let userOpportunities: BaseOpportunity[];
  try {
    userOpportunities = (await searchForOpportunities(searchParams)).data
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <OpportunitiesErrorPage />;
  }

  return (
    <OpportunitiesPageWrapper>
      {userOpportunities?.length ? (
        <OpportunitiesTable userOpportunities={userOpportunities} />
      ) : (
        <NoStartedOpportunities />
      )}
    </OpportunitiesPageWrapper>
  );
}
