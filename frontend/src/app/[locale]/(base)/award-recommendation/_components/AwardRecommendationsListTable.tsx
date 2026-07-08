"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationListItem,
  AwardRecommendationStatus,
} from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination } from "@trussworks/react-uswds";

import AwardRecommendationStatusTag from "src/components/award-recommendation/AwardRecommendationStatusTag";
import SimplerAlert from "src/components/core/SimplerAlert";
import Spinner from "src/components/core/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

const PAGE_SIZE = 10;

const getAwardRecommendationHref = (
  awardRecommendationId: string,
  status: AwardRecommendationStatus,
): string => {
  if (status === "draft") {
    return `/award-recommendation/${awardRecommendationId}/edit`;
  }
  return `/award-recommendation/${awardRecommendationId}`;
};

interface AwardRecommendationsListTableProps {
  currentAgencyId: string;
  onTotalRecordsChange?: (totalRecords: number) => void;
}

export default function AwardRecommendationsListTable({
  currentAgencyId,
  onTotalRecordsChange,
}: AwardRecommendationsListTableProps) {
  const t = useTranslations("AwardRecommendation.list");
  const [awardRecommendations, setAwardRecommendations] = useState<
    AwardRecommendationListItem[]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const { clientFetch } = useClientFetch(
    "Error fetching award recommendations",
  );

  const fetchAwardRecommendations = async () => {
    setLoading(true);
    setApiError(false);

    const pagination = {
      page_offset: page,
      page_size: PAGE_SIZE,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending" as const,
        },
      ],
    };

    try {
      const responseBody = (await clientFetch(
        "/api/award-recommendations/list",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagination, agencyId: currentAgencyId }),
        },
      )) as {
        data: AwardRecommendationListItem[];
        pagination_info?: PaginationInfo;
      };

      setAwardRecommendations(responseBody.data || []);
      setTotalPages(responseBody.pagination_info?.total_pages || 1);
      onTotalRecordsChange?.(responseBody.pagination_info?.total_records ?? 0);
    } catch (error) {
      setApiError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [currentAgencyId]);

  useEffect(() => {
    void fetchAwardRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgencyId, page, clientFetch]);

  const headers: TableCellData[] = [
    { cellData: t("columns.awardRecId") },
    { cellData: t("columns.opportunityName") },
    { cellData: t("columns.opportunityId") },
    { cellData: t("columns.applicationsReceived") },
    { cellData: t("columns.status") },
    { cellData: t("columns.action") },
  ];

  const rows: TableCellData[][] = awardRecommendations.map(
    (awardRecommendation) => {
      const {
        award_recommendation_id,
        award_recommendation_number,
        award_recommendation_status,
        opportunity,
        award_recommendation_summary,
      } = awardRecommendation;

      const applicationsReceived =
        award_recommendation_summary?.total_received_count ?? 0;

      return [
        {
          cellData: (
            <Link
              href={getAwardRecommendationHref(
                award_recommendation_id,
                award_recommendation_status,
              )}
              className="usa-link"
            >
              {award_recommendation_number}
            </Link>
          ),
        },
        {
          cellData: (
            <Link
              href={`/opportunity/${opportunity.opportunity_id}`}
              className="usa-link"
            >
              {opportunity.opportunity_title}
            </Link>
          ),
        },
        { cellData: opportunity.opportunity_number },
        { cellData: applicationsReceived },
        {
          cellData: (
            <AwardRecommendationStatusTag
              status={award_recommendation_status}
            />
          ),
        },
        {
          cellData: null,
        },
      ];
    },
  );

  return (
    <>
      {apiError && (
        <SimplerAlert
          alertClick={() => setApiError(false)}
          buttonId="award-recommendations-list-error-alert"
          messageText={t("fetchError")}
          type="error"
        />
      )}
      {!loading && awardRecommendations.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <div className="position-relative" aria-busy={loading}>
          {loading && (
            <div
              className="position-absolute top-0 left-0 width-full height-full display-flex flex-justify-center flex-align-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.65)" }}
            >
              <Spinner className="height-3 width-3" />
            </div>
          )}

          <TableWithResponsiveHeader
            headerContent={headers}
            tableRowData={rows}
          />

          {awardRecommendations.length > 0 && (
            <Pagination
              pathname=""
              totalPages={totalPages}
              currentPage={page}
              maxSlots={7}
              onClickNext={() => {
                if (loading) return;
                setPage(page + 1);
              }}
              onClickPrevious={() => {
                if (loading) return;
                setPage(page > 1 ? page - 1 : 1);
              }}
              onClickPageNumber={(_, nextPage) => {
                if (loading) return;
                setPage(nextPage);
              }}
              aria-disabled={loading}
            />
          )}
        </div>
      )}
    </>
  );
}
