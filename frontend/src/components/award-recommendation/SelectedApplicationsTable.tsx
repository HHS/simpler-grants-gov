"use client";

import {
  AwardRecommendationSubmission,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import { formatCurrencyString } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

const EMPTY_CELL = "—";

const tableCell = (
  cellData: TableCellData["cellData"],
  className?: string,
): TableCellData => ({
  cellData,
  className,
});

const recommendationTypeTagBaseClass =
  "usa-tag font-sans-sm text-no-uppercase text-ink radius-2 text-no-wrap";

const RecommendationTypeTag = ({
  recommendationType,
}: {
  recommendationType?: AwardRecommendationType;
}) => {
  const t = useTranslations(
    "AwardRecommendation.recommendations.submissions.recommendationOptions",
  );

  if (!recommendationType) {
    return EMPTY_CELL;
  }

  switch (recommendationType) {
    case "recommended_for_funding":
      return (
        <span className={`${recommendationTypeTagBaseClass} bg-info-lighter`}>
          {t("recommended")}
        </span>
      );
    case "recommended_without_funding":
      return (
        <span
          className={`${recommendationTypeTagBaseClass} bg-accent-warm-lightest`}
        >
          {t("recommendedWithoutFunding")}
        </span>
      );
    case "not_recommended":
      return (
        <span className={`${recommendationTypeTagBaseClass} bg-error-lighter`}>
          {t("notRecommended")}
        </span>
      );
    default:
      return EMPTY_CELL;
  }
};

type SelectedApplicationsTableProps = {
  awardRecommendationId: string;
  submissions: AwardRecommendationSubmission[];
};

export default function SelectedApplicationsTable({
  awardRecommendationId,
  submissions,
}: SelectedApplicationsTableProps) {
  const t = useTranslations("AwardRecommendation.risks");

  const headers: TableCellData[] = [
    tableCell(t("columns.appNumber")),
    tableCell(t("columns.projectTitle")),
    tableCell(t("columns.orgName")),
    tableCell(t("columns.uei"), "text-no-wrap"),
    tableCell(t("columns.score")),
    tableCell(t("columns.recommendation")),
    tableCell(t("columns.requested"), "text-right text-no-wrap"),
    tableCell(t("columns.recommended"), "text-right"),
  ];

  const rows: TableCellData[][] = submissions.map((submission) => {
    const appSubmission = submission.application_submission;
    const detail = submission.submission_detail;
    const id = submission.award_recommendation_application_submission_id;

    return [
      tableCell(
        appSubmission.application_submission_number ? (
          <Link
            href={`/award-recommendation/${awardRecommendationId}/application-submissions/${id}/edit`}
            className="usa-link"
          >
            {appSubmission.application_submission_number}
          </Link>
        ) : (
          EMPTY_CELL
        ),
      ),
      tableCell(appSubmission.project_title || EMPTY_CELL),
      tableCell(
        appSubmission.application?.organization?.organization_name ||
          EMPTY_CELL,
      ),
      tableCell(
        appSubmission.application?.organization?.uei || EMPTY_CELL,
        "text-no-wrap",
      ),
      tableCell(detail?.scoring_comment || EMPTY_CELL),
      tableCell(
        <RecommendationTypeTag
          recommendationType={detail?.award_recommendation_type}
        />,
      ),
      tableCell(
        formatCurrencyString(appSubmission.total_requested_amount) ||
          EMPTY_CELL,
        "text-right text-no-wrap",
      ),
      tableCell(
        formatCurrencyString(detail?.recommended_amount) || EMPTY_CELL,
        "text-right",
      ),
    ];
  });

  return (
    <div className="width-full minw-0 overflow-auto">
      <TableWithResponsiveHeader headerContent={headers} tableRowData={rows} />
    </div>
  );
}
