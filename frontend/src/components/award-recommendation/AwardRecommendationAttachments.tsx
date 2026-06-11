"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { AwardRecommendationRisk } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination } from "@trussworks/react-uswds";

import { PopoverMenu } from "src/components/core/PopoverMenu";
import SimplerAlert from "src/components/core/SimplerAlert";
import Spinner from "src/components/core/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

interface AwardRecommendationAttachmentsProps {
  awardRecommendationId: string;
  mode?: "view" | "edit";
}

export const AwardRecommendationAttachments = ({
  awardRecommendationId,
  mode = "view",
}: AwardRecommendationAttachmentsProps) => {
  const t = useTranslations("AwardRecommendation.attachments");
  const [risks, setRisks] = useState<AwardRecommendationRisk[]>([]);
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
      const responseBody = (await clientFetch(
        `/api/award-recommendations/${awardRecommendationId}/risks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagination }),
        },
      )) as {
        data: AwardRecommendationRisk[];
        pagination_info?: PaginationInfo;
      };
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
    void fetchRisks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardRecommendationId, page, pageSize, clientFetch]);

  // Standard and program terms & conditions table (empty)
  const standardHeaders: TableCellData[] = [
    { cellData: t("attachedDocument") },
    { cellData: t("uploadedBy") },
    { cellData: t("uploadDate") },
  ];
  const standardRows: TableCellData[][] = [];

  // Risks table
  const risksHeaders: TableCellData[] = [
    { cellData: t("riskNumber") },
    { cellData: t("appNumber") },
    { cellData: t("condition") },
    ...(mode === "edit" ? [{ cellData: t("action") }] : []),
  ];
  const risksRows: TableCellData[][] = risks.map(
    (risk: AwardRecommendationRisk) => [
      {
        cellData: (
          <a href="#">
            {risk.risk_number || risk.award_recommendation_risk_number}
          </a>
        ),
      },
      {
        cellData: (() => {
          if (Array.isArray(risk.applications)) {
            if (risk.applications.length === 0) return "-";
            if (risk.applications.length === 1)
              return risk.applications[0].application_submission_number;
            return `${risk.applications.length} ${t("applications")}`;
          }
          return "-";
        })(),
      },
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
                    onClick={() => {
                      void (async () => {
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
                      })();
                    }}
                    type="button"
                  >
                    {t("delete")}
                  </button>
                </PopoverMenu>
              ),
            },
          ]
        : []),
    ],
  );

  // Other supporting documents table (empty)
  const otherHeaders: TableCellData[] = [
    { cellData: t("attachedDocument") },
    { cellData: t("uploadedBy") },
    { cellData: t("uploadDate") },
  ];
  const otherRows: TableCellData[][] = [];

  return (
    <section className="margin-top-8">
      <h2 className="margin-bottom-1">{t("heading")}</h2>
      <div className="display-flex flex-justify flex-align-end margin-bottom-1">
        <h3 className="margin-y-0">{t("standardTermsHeading")}</h3>
        {mode === "edit" && standardRows.length > 0 && (
          <a
            href="#"
            className="text-bold"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            {t("editTermsConditions")}
          </a>
        )}
      </div>
      {mode === "edit" && standardRows.length === 0 ? (
        <div className="bg-base-lighter radius-md padding-y-2 padding-x-3 margin-bottom-2">
          <a
            className="text-bold text-left display-block width-full"
            href="#"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            {t("enterTermsConditions")}
          </a>
        </div>
      ) : (
        <TableWithResponsiveHeader
          headerContent={standardHeaders}
          tableRowData={standardRows}
        />
      )}
      <div className="display-flex flex-justify flex-align-end margin-top-6 margin-bottom-1">
        <h3 className="margin-y-0">{t("risksHeading")}</h3>
        {mode === "edit" && risks.length > 0 && (
          <Link
            href={`/award-recommendation/${awardRecommendationId}/risks`}
            className="text-bold"
            style={{ textDecoration: "underline" }}
          >
            {t("editRisks")}
          </Link>
        )}
      </div>
      {apiError && (
        <SimplerAlert
          alertClick={() => setApiError(false)}
          buttonId="risks-error-alert"
          messageText={t("errorMessage")}
          type="error"
        />
      )}
      {loading ? (
        <div className="display-flex flex-justify-center padding-y-4">
          <Spinner className="height-3 width-3" />
        </div>
      ) : mode === "edit" && risks.length === 0 ? (
        <div className="bg-base-lighter radius-md padding-y-2 padding-x-3 margin-bottom-2">
          <Link
            href={`/award-recommendation/${awardRecommendationId}/risks`}
            className="text-bold text-left display-block width-full"
            style={{ textDecoration: "underline" }}
          >
            {t("enterRisks")}
          </Link>
        </div>
      ) : (
        <>
          <TableWithResponsiveHeader
            headerContent={risksHeaders}
            tableRowData={risksRows}
          />
          {risks.length > 0 && (
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
          )}
        </>
      )}
      <div className="display-flex flex-justify flex-align-end margin-top-6 margin-bottom-1">
        <h3 className="margin-y-0">{t("otherDocumentsHeading")}</h3>
        {mode === "edit" && otherRows.length > 0 && (
          <a
            href="#"
            className="text-bold"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            {t("editSupportingDocuments")}
          </a>
        )}
      </div>
      {mode === "edit" && otherRows.length === 0 ? (
        <div className="bg-base-lighter radius-md padding-y-2 padding-x-3 margin-bottom-2">
          <a
            className="text-bold text-left display-block width-full"
            href="#"
            style={{ textDecoration: "underline" }}
            onClick={() => {
              /* TODO: implement routing */
            }}
          >
            {t("enterSupportingDocuments")}
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
