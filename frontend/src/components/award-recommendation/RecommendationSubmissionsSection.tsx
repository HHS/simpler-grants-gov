"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationSubmission,
  AwardRecommendationSubmissionListFilters,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import { formatCurrencyString } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/core/SimplerAlert";
import Spinner from "src/components/core/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

const EMPTY_CELL = "---";
const PAGE_SIZE = 10;
const NO_WRAP_CELL_CLASS = "text-no-wrap";

const nowrapTableCell = (
  cellData: TableCellData["cellData"],
  className?: string,
): TableCellData => ({
  cellData,
  className: className
    ? `${NO_WRAP_CELL_CLASS} ${className}`
    : NO_WRAP_CELL_CLASS,
});

type RecommendationSubmissionsSectionProps = {
  awardRecommendationId: string;
  viewMode?: boolean;
};

type SubmissionTableProps = {
  awardRecommendationId: string;
  filters?: AwardRecommendationSubmissionListFilters;
  heading?: string;
};

const getSubmissionDetailHref = (
  awardRecommendationId: string,
  submissionId: string,
) =>
  `/award-recommendation/${awardRecommendationId}/application-submissions/${submissionId}/edit`;

const formatCellValue = (value?: string) => {
  if (!value) {
    return EMPTY_CELL;
  }

  const formatted = formatCurrencyString(value);
  return formatted || EMPTY_CELL;
};

const recommendationTypeTagBaseClass =
  "usa-tag font-sans-sm text-no-uppercase text-ink radius-2";

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

const SubmissionTable = ({
  awardRecommendationId,
  filters,
  heading,
}: SubmissionTableProps) => {
  const t = useTranslations("AwardRecommendation.recommendations.submissions");
  const [submissions, setSubmissions] = useState<
    AwardRecommendationSubmission[]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const { clientFetch } = useClientFetch("Error fetching submissions");

  const fetchSubmissions = async () => {
    setLoading(true);
    setApiError(false);

    const pagination = {
      page_offset: page,
      page_size: PAGE_SIZE,
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
          body: JSON.stringify({
            pagination,
            ...(filters ? { filters } : {}),
          }),
        },
      )) as {
        data: AwardRecommendationSubmission[];
        pagination_info?: PaginationInfo;
      };

      setSubmissions(responseBody.data || []);
      setTotalPages(responseBody.pagination_info?.total_pages || 1);
    } catch (error) {
      setApiError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardRecommendationId, page, clientFetch]);

  const headers: TableCellData[] = [
    nowrapTableCell(t("columns.appNumber")),
    nowrapTableCell(t("columns.projectTitle")),
    nowrapTableCell(t("columns.orgName")),
    nowrapTableCell(t("columns.uei")),
    nowrapTableCell(t("columns.score")),
    nowrapTableCell(t("columns.recommendation")),
    nowrapTableCell(t("columns.requested"), "text-right"),
    nowrapTableCell(t("columns.recommended"), "text-right"),
  ];

  const rows: TableCellData[][] = submissions.map((submission) => {
    const applicationSubmission = submission.application_submission;
    const submissionDetail = submission.submission_detail;
    const appNumber =
      applicationSubmission.application_submission_number || EMPTY_CELL;

    return [
      nowrapTableCell(
        <Link
          href={getSubmissionDetailHref(
            awardRecommendationId,
            submission.award_recommendation_application_submission_id,
          )}
        >
          {appNumber}
        </Link>,
      ),
      nowrapTableCell(applicationSubmission.project_title || EMPTY_CELL),
      nowrapTableCell(
        applicationSubmission.application?.organization?.organization_name ||
          EMPTY_CELL,
      ),
      nowrapTableCell(
        applicationSubmission.application?.organization?.uei || EMPTY_CELL,
      ),
      nowrapTableCell(submissionDetail?.scoring_comment || EMPTY_CELL),
      nowrapTableCell(
        <RecommendationTypeTag
          recommendationType={submissionDetail?.award_recommendation_type}
        />,
      ),
      nowrapTableCell(
        formatCellValue(applicationSubmission.total_requested_amount),
        "text-right",
      ),
      nowrapTableCell(
        formatCellValue(submissionDetail?.recommended_amount),
        "text-right",
      ),
    ];
  });

  return (
    <div className="margin-top-0">
      {heading ? (
        <h3 className="margin-top-0 margin-bottom-2 font-sans-md">{heading}</h3>
      ) : null}
      {apiError && (
        <SimplerAlert
          alertClick={() => setApiError(false)}
          buttonId="submissions-error-alert"
          messageText={t("errorMessage")}
          type="error"
        />
      )}
      {loading && submissions.length === 0 ? (
        <Spinner />
      ) : (
        <>
          <div className="width-full minw-0 overflow-auto recommendation-submissions-table">
            <TableWithResponsiveHeader
              headerContent={headers}
              tableRowData={rows}
            />
          </div>
          {submissions.length > 0 && (
            <Pagination
              pathname=""
              totalPages={totalPages}
              currentPage={page}
              maxSlots={7}
              onClickNext={() => setPage(page + 1)}
              onClickPrevious={() => setPage(page > 1 ? page - 1 : 1)}
              onClickPageNumber={(_, nextPage) => setPage(nextPage)}
              aria-disabled={loading}
            />
          )}
        </>
      )}
    </div>
  );
};

const useSubmissionSectionVisibility = (
  awardRecommendationId: string,
  filterKey: "recommended" | "exceptions",
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { clientFetch } = useClientFetch("Error checking submissions");

  useEffect(() => {
    const filters: AwardRecommendationSubmissionListFilters =
      filterKey === "recommended"
        ? { award_recommendation_type: { one_of: ["recommended_for_funding"] } }
        : { has_exception: { one_of: [true] } };

    const checkVisibility = async () => {
      setLoading(true);

      try {
        const responseBody = (await clientFetch(
          `/api/award-recommendations/${awardRecommendationId}/submissions/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filters,
              pagination: {
                page_offset: 1,
                page_size: 1,
                sort_order: [
                  {
                    order_by: "application_submission_number",
                    sort_direction: "ascending",
                  },
                ],
              },
            }),
          },
        )) as {
          pagination_info?: PaginationInfo;
        };

        setIsVisible((responseBody.pagination_info?.total_records ?? 0) > 0);
      } catch (error) {
        console.error(error);
        setIsVisible(false);
      } finally {
        setLoading(false);
      }
    };

    void checkVisibility();
  }, [awardRecommendationId, clientFetch, filterKey]);

  return { isVisible, loading };
};

export const RecommendationSubmissionsSection = ({
  awardRecommendationId,
  viewMode = false,
}: RecommendationSubmissionsSectionProps) => {
  const t = useTranslations("AwardRecommendation.recommendations.submissions");

  const recommendedFilters: AwardRecommendationSubmissionListFilters = {
    award_recommendation_type: { one_of: ["recommended_for_funding"] },
  };
  const exceptionsFilters: AwardRecommendationSubmissionListFilters = {
    has_exception: { one_of: [true] },
  };

  const { isVisible: showRecommended, loading: recommendedVisibilityLoading } =
    useSubmissionSectionVisibility(awardRecommendationId, "recommended");
  const { isVisible: showExceptions, loading: exceptionsVisibilityLoading } =
    useSubmissionSectionVisibility(awardRecommendationId, "exceptions");

  if (!viewMode) {
    if (recommendedVisibilityLoading || exceptionsVisibilityLoading) {
      return <Spinner />;
    }

    return (
      <div className="margin-top-4">
        <div className="margin-bottom-4">
          <div className="display-flex flex-justify flex-align-end margin-bottom-1">
            <h3 className="margin-top-0 margin-bottom-0 font-sans-md">
              {t("recommendedAwards.heading")}
            </h3>
            {showRecommended && (
              <Link
                className="text-bold text-underline"
                href={`/award-recommendation/${awardRecommendationId}/application-submissions/edit`}
              >
                {t("recommendedAwards.editLink")}
              </Link>
            )}
          </div>
          <p className="text-base-dark margin-top-0">
            {t("recommendedAwards.editDescription")}
          </p>
          {showRecommended ? (
            <SubmissionTable
              awardRecommendationId={awardRecommendationId}
              filters={recommendedFilters}
            />
          ) : (
            <div className="bg-base-lighter radius-md padding-y-2 padding-x-3">
              <Link
                className="text-bold text-left display-block width-full text-underline"
                href={`/award-recommendation/${awardRecommendationId}/application-submissions/edit`}
              >
                {t("recommendedAwards.editLink")}
              </Link>
            </div>
          )}
        </div>
        {showExceptions && (
          <SubmissionTable
            awardRecommendationId={awardRecommendationId}
            filters={exceptionsFilters}
            heading={t("exceptions.heading")}
          />
        )}
      </div>
    );
  }

  if (recommendedVisibilityLoading || exceptionsVisibilityLoading) {
    return <Spinner />;
  }

  if (!showRecommended && !showExceptions) {
    return null;
  }

  return (
    <div className="margin-top-4">
      {showRecommended && (
        <SubmissionTable
          awardRecommendationId={awardRecommendationId}
          filters={recommendedFilters}
          heading={t("recommendedAwards.heading")}
        />
      )}
      {showExceptions && (
        <SubmissionTable
          awardRecommendationId={awardRecommendationId}
          filters={exceptionsFilters}
          heading={t("exceptions.heading")}
        />
      )}
    </div>
  );
};
