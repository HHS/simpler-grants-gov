import { UnauthorizedError } from "src/errors";
import { fetchApplications } from "src/services/fetch/fetchers/applicationsFetcher";
import { ApplicationDetail, Status } from "src/types/applicationResponseTypes";
import { LocalizedPageProps, TFn } from "src/types/intl";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FunctionComponent, PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

const PageLayout: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const t = useTranslations("Applications");
  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">{t("pageTitle")}</h1>
      {children}
    </GridContainer>
  );
};

const NoStartedApplications = () => {
  const t = useTranslations("Applications");

  return (
    <div className="margin-bottom-15">
      <div className="font-sans-xl text-bold margin-bottom-3">
        {t("noApplicationsMessage.primary")}
      </div>
      <div>{t("noApplicationsMessage.secondary")}</div>
    </div>
  );
};

const ApplicationsErrorPage = () => {
  const t = useTranslations("Applications");

  return (
    <PageLayout>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("errorMessage")}
        </Alert>
      </div>
    </PageLayout>
  );
};

const transformTableRowData = (
  userApplications: ApplicationDetail[],
  t: TFn,
) => {
  return userApplications.map((application: ApplicationDetail) => {
    return [
      { cellData: formatDate(application.competition.closing_date) },
      {
        cellData:
          application.application_status === Status.IN_PROGRESS
            ? t("Applications.tableContents.draft")
            : t("Applications.tableContents.submitted"),
      },
      {
        cellData: (
          <a
            href={`/workspace/applications/application/${application.application_id}`}
          >
            {application.application_name}
          </a>
        ),
      },
      {
        cellData: application.organization
          ? application.organization.sam_gov_entity.legal_business_name
          : t("Applications.tableContents.individual"),
      },
      {
        cellData: (
          <div>
            <a
              href={`/opportunity/${application.competition.opportunity.opportunity_id}`}
            >
              {application.competition.opportunity.opportunity_title}
            </a>
            <div className="font-sans-3xs">
              <span className="text-bold">
                {t("Applications.tableContents.agency")}{" "}
              </span>
              {application.competition.opportunity.agency_name}
            </div>
          </div>
        ),
      },
    ];
  });
};

const ApplicationsTable = ({
  userApplications,
}: {
  userApplications: ApplicationDetail[];
}) => {
  const t = useTranslations();

  const headerTitles: TableCellData[] = [
    { cellData: t("Applications.tableHeadings.closeDate") },
    { cellData: t("Applications.tableHeadings.status") },
    { cellData: t("Applications.tableHeadings.applicationName") },
    { cellData: t("Applications.tableHeadings.type") },
    { cellData: t("Applications.tableHeadings.opportunity") },
  ];

  return (
    <div>
      <span className="font-sans-lg text-bold">
        {userApplications.length} applications
      </span>

      <TableWithResponsiveHeader
        headerContent={headerTitles}
        tableRowData={transformTableRowData(userApplications, t)}
      />
    </div>
  );
};

export default async function Applications({ params }: LocalizedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations({ locale });

  let userApplications: ApplicationDetail[];
  try {
    userApplications = await fetchApplications();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <ApplicationsErrorPage />;
  }

  return (
    <PageLayout>
      {userApplications?.length ? (
        <ApplicationsTable userApplications={userApplications} />
      ) : (
        <NoStartedApplications />
      )}
    </PageLayout>
  );
}
