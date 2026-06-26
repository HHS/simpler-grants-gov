"use client";

import { createAwardRecommendationAction } from "src/app/[locale]/(base)/award-recommendation/select-opportunity/actions";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@trussworks/react-uswds";

type SelectFundingOpportunityContentProps = {
  fundingOpportunities: BaseOpportunity[];
};

export const SelectFundingOpportunityContent = ({
  fundingOpportunities,
}: SelectFundingOpportunityContentProps) => {
  const t = useTranslations("AwardRecommendationSelectFundingOpportunity");
  const router = useRouter();
  const [creatingOpportunityId, setCreatingOpportunityId] = useState<
    string | null
  >(null);

  const handleCancel = () => {
    router.push("/");
  };

  const handleCreateAwardRecommendation = async (
    fundingOpportunityId: string,
  ) => {
    setCreatingOpportunityId(fundingOpportunityId);

    try {
      const { awardRecommendationId } =
        await createAwardRecommendationAction(fundingOpportunityId);

      router.push(`/award-recommendation/${awardRecommendationId}/edit`);
    } finally {
      setCreatingOpportunityId(null);
    }
  };

  const headerContent: TableCellData[] = [
    { cellData: t("columns.fundingOpportunityNumber") },
    { cellData: t("columns.fundingOpportunityName") },
    { cellData: t("columns.submittedApplications") },
    { cellData: t("columns.action") },
  ];

  const tableRowData: TableCellData[][] = fundingOpportunities.map(
    (fundingOpportunity) => {
      const isCreating =
        creatingOpportunityId === fundingOpportunity.opportunity_id;

      return [
        {
          cellData: (
            <Link
              href={`/opportunity/${fundingOpportunity.opportunity_id}`}
              className="usa-link"
            >
              {fundingOpportunity.opportunity_number}
            </Link>
          ),
        },
        { cellData: fundingOpportunity.opportunity_title },
        { cellData: fundingOpportunity.submitted_application_count ?? 0 },
        {
          cellData: (
            <Button
              type="button"
              className="usa-button--outline margin-y-0"
              disabled={isCreating}
              onClick={() => {
                void handleCreateAwardRecommendation(
                  fundingOpportunity.opportunity_id,
                );
              }}
            >
              {t("startButtonText")} <span aria-hidden="true">→</span>
            </Button>
          ),
        },
      ];
    },
  );

  return (
    <>
      <div className="margin-top-5 margin-bottom-5">
        <h2 className="margin-top-0 margin-bottom-2 font-sans-xl text-bold">
          {t("whichFundingOpportunity")}
        </h2>
      </div>

      <TableWithResponsiveHeader
        headerContent={headerContent}
        tableRowData={tableRowData}
      />

      <div className="margin-top-5">
        <Button
          type="button"
          className="usa-button--outline"
          onClick={handleCancel}
        >
          {t("cancelButtonText")}
        </Button>
      </div>
    </>
  );
};