"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useEffect, useState } from "react";
import { GridContainer, Pagination } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

interface AwardRecommendationAttachmentsProps {
  awardRecommendationId: string;
}

export const AwardRecommendationAttachments = ({
  awardRecommendationId,
}: AwardRecommendationAttachmentsProps) => {
  const [risks, setRisks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // adjust as needed
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { clientFetch } = useClientFetch("Error fetching risks");

  useEffect(() => {
    setLoading(true);
    const pagination = {
      page_offset: page,
      page_size: pageSize,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "ascending"
        }
      ],
    };
    clientFetch(`/api/award-recommendations/${awardRecommendationId}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagination }),
    })
      .then((responseBody: any) => {
        setRisks(responseBody.data || []);
        setTotalPages(responseBody.pagination_info?.total_pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [awardRecommendationId, page, pageSize, clientFetch]);

  // Standard and program terms & conditions table (empty)
  const standardHeaders: TableCellData[] = [
    { cellData: "Attached document" },
    { cellData: "Uploaded by" },
    { cellData: "Upload date" },
  ];
  const standardRows: TableCellData[][] = [];

  // Risks table
  const risksHeaders: TableCellData[] = [
    { cellData: "Risk #" },
    { cellData: "App #" },
    { cellData: "Condition" },
  ];
  const risksRows: TableCellData[][] = risks.map((risk) => [
    {
      cellData: (
        <a href="#">
          {risk.risk_number || risk.award_recommendation_risk_number}
        </a>
      ),
    },
    { cellData: risk.application_numbers || risk.app_number || "-" },
    {
      cellData: (
        <a href="#">{risk.condition_number || risk.condition || "-"}</a>
      ),
    },
  ]);

  // Other supporting documents table (empty)
  const otherHeaders: TableCellData[] = [
    { cellData: "Attached document" },
    { cellData: "Uploaded by" },
    { cellData: "Upload date" },
  ];
  const otherRows: TableCellData[][] = [];

  return (
    <GridContainer>
      <section className="margin-top-8">
        <h2>Attachments</h2>
        <h3 className="margin-bottom-1">
          Standard and program terms & conditions
        </h3>
        <TableWithResponsiveHeader
          headerContent={standardHeaders}
          tableRowData={standardRows}
        />
        <h3 className="margin-top-6 margin-bottom-1">
          Specific risks & recommended conditions
        </h3>
        <TableWithResponsiveHeader
          headerContent={risksHeaders}
          tableRowData={risksRows}
        />
        <Pagination
          pathname=""
          totalPages={totalPages}
          currentPage={page}
          maxSlots={7}
          onClickNext={() => setPage(page + 1)}
          onClickPrevious={() => setPage(page > 1 ? page - 1 : 1)}
          onClickPageNumber={(_, p) => setPage(p)}
          aria-disabled={loading}
        />
        <h3 className="margin-top-6 margin-bottom-1">
          Other supporting documents
        </h3>
        <TableWithResponsiveHeader
          headerContent={otherHeaders}
          tableRowData={otherRows}
        />
      </section>
    </GridContainer>
  );
};

export default AwardRecommendationAttachments;
