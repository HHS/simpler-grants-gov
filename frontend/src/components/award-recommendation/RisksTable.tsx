"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useSelectedSubmissions } from "src/hooks/useSelectedSubmissions";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination, Table, Tag } from "@trussworks/react-uswds";

interface RisksTableProps {
  awardRecommendationId: string;
}

export default function RisksTable({ awardRecommendationId }: RisksTableProps) {
  const t = useTranslations("AwardRecommendation.risks");
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

  const pageSize = 10;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const fetchSubmissions = async () => {
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

    try {
      const responseBody = (await clientFetch(
        `/api/award-recommendations/${awardRecommendationId}/submissions/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagination }),
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
  };

  useEffect(() => {
    void fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardRecommendationId, currentPage, pageSize, clientFetch]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all submissions on current page in a single batch operation
      const submissionsToAdd = submissions.filter(
        (s) =>
          !selectedSubmissionIds.has(
            s.award_recommendation_application_submission_id,
          ),
      );
      addMultipleSubmissions(submissionsToAdd);
    } else {
      // Remove all submissions on current page
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

  // Calculate selection state for current page only
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

  // Calculate showing range
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

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
          <div className="display-flex flex-align-center">
            <span className="text-bold margin-right-1">
              {t("selectedCount", { count: selectedSubmissionIds.size })}
            </span>
            <button
              type="button"
              className="usa-button"
              onClick={() => {
                /* TODO: Navigate to edit page */
              }}
            >
              {t("editButton")}
            </button>
          </div>
        )}
      </div>

      <Table bordered fullWidth>
        <thead>
          <tr>
            <th scope="col" className="width-5">
              <input
                type="checkbox"
                className="risks-table-checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label={t("selectAll")}
              />
            </th>
            <th scope="col">{t("columns.appNumber")}</th>
            <th scope="col">{t("columns.projectTitle")}</th>
            <th scope="col">{t("columns.orgName")}</th>
            <th scope="col">{t("columns.uei")}</th>
            <th scope="col">{t("columns.recommendation")}</th>
            <th scope="col">{t("columns.risk")}</th>
            <th scope="col">{t("columns.condition")}</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => {
            const id =
              submission.award_recommendation_application_submission_id;
            const appSubmission = submission.application_submission;
            const detail = submission.submission_detail;
            const isSelected = selectedSubmissionIds.has(id);

            return (
              <tr key={id} className={isSelected ? "bg-primary-lighter" : ""}>
                <td>
                  <input
                    type="checkbox"
                    className="risks-table-checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      handleSelectRow(submission, e.target.checked)
                    }
                    aria-label={t("selectRow", {
                      appNumber:
                        appSubmission.application_submission_number || "",
                    })}
                  />
                </td>
                <td>
                  {appSubmission.application_submission_number ? (
                    <Link
                      href={`/award-recommendation/${awardRecommendationId}/submissions/${id}`}
                      className="usa-link"
                    >
                      {appSubmission.application_submission_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{appSubmission.project_title || "—"}</td>
                <td>{"—"}</td>
                <td>{"—"}</td>
                <td>
                  {detail?.award_recommendation_type ===
                  "recommended_for_funding" ? (
                    <Tag className="bg-info-lighter text-info-dark radius-pill">
                      {t("recommendationType.recommended_for_funding")}
                    </Tag>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{t("defaultNone")}</td>
                <td>{t("defaultNone")}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

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
