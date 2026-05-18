"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useEffect, useState } from "react";
import { Pagination } from "@trussworks/react-uswds";

import { PopoverMenu } from "src/components/PopoverMenu";
import SimplerAlert from "src/components/SimplerAlert";
import Spinner from "src/components/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

interface AwardRecommendationAttachmentsProps {
  awardRecommendationId: string;
  mode?: "view" | "edit";
}

export const AwardRecommendationAttachments = ({
  awardRecommendationId,
  mode = "view",
}: AwardRecommendationAttachmentsProps) => {
  const [risks, setRisks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<boolean>(false);
  const { clientFetch } = useClientFetch("Error fetching risks");

  const fetchRisks = async () => {
    setLoading(true);
    setApiError(false);
    const pagination = {
      page_offset: page,
      page_size: pageSize,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "ascending",
        },
      ],
    };
    try {
      const responseBody: any = await clientFetch(
        `/api/award-recommendations/${awardRecommendationId}/risks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagination }),
        },
      );
      setRisks(responseBody.data || []);
      setTotalPages(responseBody.pagination_info?.total_pages || 1);
    } catch (error) {
      setApiError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ...(mode === "edit" ? [{ cellData: "Action" }] : []),
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
    ...(mode === "edit"
      ? [
          {
            cellData: (
              <PopoverMenu>
                <button
                  className="usa-button usa-button--unstyled width-full text-left padding-y-1 padding-x-2 hover:bg-base-lighter"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await clientFetch(
                        `/api/award-recommendations/${awardRecommendationId}/risks/${risk.award_recommendation_risk_id}`,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                        },
                      );
                      await fetchRisks();
                    } catch (error) {
                      setApiError(true);
                      console.error(error);
                      setLoading(false);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </PopoverMenu>
            ),
          },
        ]
      : []),
  ]);

  // Other supporting documents table (empty)
  const otherHeaders: TableCellData[] = [
    { cellData: "Attached document" },
    { cellData: "Uploaded by" },
    { cellData: "Upload date" },
  ];
  const otherRows: TableCellData[][] = [];

  return (
    <section className="margin-top-8">
      <h2>Attachments</h2>
      <h3 className="margin-bottom-1">
        Standard and program terms & conditions
      </h3>
      {mode === "edit" ? (
        <div className="bg-base-lighter radius-md padding-y-2 padding-x-3 margin-bottom-2">
          <a
            className="text-bold text-left display-block width-full"
            href="#"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            Enter terms & conditions
          </a>
        </div>
      ) : (
        <TableWithResponsiveHeader
          headerContent={standardHeaders}
          tableRowData={standardRows}
        />
      )}
      <h3 className="margin-top-6 margin-bottom-1">
        Specific risks & recommended conditions
      </h3>
      {apiError && (
        <SimplerAlert
          alertClick={() => setApiError(false)}
          buttonId="risks-error-alert"
          messageText="Unable to load or update risks. Please try again."
          type="error"
        />
      )}
      {loading ? (
        <div className="display-flex flex-justify-center padding-y-4">
          <Spinner className="height-3 width-3" />
        </div>
      ) : (
        <TableWithResponsiveHeader
          headerContent={risksHeaders}
          tableRowData={risksRows}
        />
      )}
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
      {mode === "edit" ? (
        <div className="bg-base-lighter radius-md padding-y-2 padding-x-3 margin-bottom-2">
          <a
            className="text-bold text-left display-block width-full"
            href="#"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            Enter supporting documents
          </a>
        </div>
      ) : (
        <TableWithResponsiveHeader
          headerContent={otherHeaders}
          tableRowData={otherRows}
        />
      )}
    </section>
  );
};

export default AwardRecommendationAttachments;
