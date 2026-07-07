"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useSelectedSubmissions } from "src/hooks/useSelectedSubmissions";
import { PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationSubmission,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import { formatCurrencyString } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@trussworks/react-uswds";

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
    return (
      <span className={`${recommendationTypeTagBaseClass} bg-base-lighter`}>
        {t("none")}
      </span>
    );
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
      return null;
  }
};

interface EditRecommendationsTableProps {
  awardRecommendationId: string;
}

export default function EditRecommendationsTable({
  awardRecommendationId,
}: EditRecommendationsTableProps) {
  const t = useTranslations("AwardRecommendation.editRecommendations");
  const router = useRouter();
  const {
    selectedSubmissionIds,
    addSubmission,
    addMultipleSubmissions,
    removeSubmission,
    setSelectedSubmissionIds,
    hasSelections,
  } = useSelectedSubmissions(awardRecommendationId);
  const [currentPage, setCurrentPage] = useState(1);
  const [submissions, setSubmissions] = useState<
    AwardRecommendationSubmission[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<boolean>(false);
  const { clientFetch } = useClientFetch("Error fetching submissions");

  const pageSize = 50;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setApiError(false);
    const pagination = {
      page_offset: currentPage,
      page_size: pageSize,
      sort_order: [
        {
          order_by: "application_submission_number",
          sort_direction: "ascending",
        },
      ],
    };

    const requestBody = { pagination };

    try {
      const responseBody = (await clientFetch(
        `/api/award-recommendations/${awardRecommendationId}/submissions/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      )) as {
        data: AwardRecommendationSubmission[];
        pagination_info?: PaginationInfo;
      };
      setSubmissions(responseBody.data || []);
      setTotalPages(responseBody.pagination_info?.total_pages || 1);
      setTotalRecords(responseBody.pagination_info?.total_records || 0);
    } catch (error) {
      setApiError(true);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [awardRecommendationId, currentPage, pageSize, clientFetch]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const submissionsToAdd = submissions.filter(
        (s) =>
          !selectedSubmissionIds.has(
            s.award_recommendation_application_submission_id,
          ),
      );
      addMultipleSubmissions(submissionsToAdd);
    } else {
      const currentPageIds = submissions.map(
        (s) => s.award_recommendation_application_submission_id,
      );
      const newIds = new Set(selectedSubmissionIds);
      currentPageIds.forEach((id) => newIds.delete(id));
      setSelectedSubmissionIds(newIds);
    }
  };

  const handleSelectRow = (
    submission: AwardRecommendationSubmission,
    checked: boolean,
  ) => {
    if (checked) {
      addSubmission(submission);
    } else {
      removeSubmission(
        submission.award_recommendation_application_submission_id,
      );
    }
  };

  const currentPageSelectedCount = submissions.filter((s) =>
    selectedSubmissionIds.has(s.award_recommendation_application_submission_id),
  ).length;
  const allSelected =
    submissions.length > 0 &&
    currentPageSelectedCount === submissions.length &&
    currentPageSelectedCount > 0;
  const someSelected = currentPageSelectedCount > 0 && !allSelected;

  if (apiError) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">{t("errorLoading")}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center padding-4">{t("loading")}</div>;
  }

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const headers: TableCellData[] = [
    tableCell(
      <input
        type="checkbox"
        className="edit-recommendations-table-checkbox"
        checked={allSelected}
        ref={(input) => {
          if (input) {
            input.indeterminate = someSelected;
          }
        }}
        onChange={(e) => handleSelectAll(e.target.checked)}
        aria-label={t("selectAll")}
      />,
      "width-5",
    ),
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
    const id = submission.award_recommendation_application_submission_id;
    const appSubmission = submission.application_submission;
    const detail = submission.submission_detail;
    const isSelected = selectedSubmissionIds.has(id);

    return [
      tableCell(
        <input
          type="checkbox"
          className="edit-recommendations-table-checkbox"
          checked={isSelected}
          onChange={(e) => handleSelectRow(submission, e.target.checked)}
          aria-label={t("selectRow", {
            appNumber: appSubmission.application_submission_number || "",
          })}
        />,
      ),
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
    <div>
      <div className="bg-base-lightest padding-2 margin-bottom-2 display-flex flex-justify">
        <span className="text-bold">
          {t("showingRange", {
            start: startRecord,
            end: endRecord,
            total: totalRecords,
          })}
        </span>
        {hasSelections && (
          <div
            className="display-flex flex-align-center"
            suppressHydrationWarning
          >
            <span className="text-bold margin-right-1">
              {t("selectedCount", { count: selectedSubmissionIds.size })}
            </span>
            <button
              type="button"
              className="usa-button"
              onClick={() => {
                router.push(
                  `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
                );
              }}
            >
              {t("editButton")}
            </button>
          </div>
        )}
      </div>

      <div className="width-full minw-0 overflow-auto">
        <TableWithResponsiveHeader
          headerContent={headers}
          tableRowData={rows}
        />
      </div>

      {totalPages > 1 && (
        <Pagination
          pathname=""
          totalPages={totalPages}
          currentPage={currentPage}
          maxSlots={7}
          onClickNext={() => handlePageChange(currentPage + 1)}
          onClickPrevious={() =>
            handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
          }
          onClickPageNumber={(_, page) => handlePageChange(page)}
          aria-disabled={isLoading}
        />
      )}
    </div>
  );
}
