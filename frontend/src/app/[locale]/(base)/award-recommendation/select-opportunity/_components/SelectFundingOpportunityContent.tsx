"use client";

import { createAwardRecommendationAction } from "src/app/[locale]/(base)/award-recommendation/select-opportunity/actions";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Table } from "@trussworks/react-uswds";

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

  return (
    <>
      <div className="margin-top-5 margin-bottom-5">
        <h2 className="margin-top-0 margin-bottom-2 font-sans-xl text-bold">
          {t("whichFundingOpportunity")}
        </h2>
      </div>

      <Table fullWidth>
        <thead>
          <tr>
            <th scope="col">{t("columns.fundingOpportunityNumber")}</th>
            <th scope="col">{t("columns.fundingOpportunityName")}</th>
            <th scope="col">{t("columns.submittedApplications")}</th>
            <th scope="col">{t("columns.action")}</th>
          </tr>
        </thead>
        <tbody>
          {fundingOpportunities.map((fundingOpportunity) => {
            const isCreating =
              creatingOpportunityId === fundingOpportunity.opportunity_id;

            return (
              <tr key={fundingOpportunity.opportunity_id}>
                <td>
                  <Link
                    href={`/opportunity/${fundingOpportunity.opportunity_id}`}
                    className="usa-link"
                  >
                    {fundingOpportunity.opportunity_number}
                  </Link>
                </td>
                <td>{fundingOpportunity.opportunity_title}</td>
                <td>{fundingOpportunity.submitted_application_count ?? 0}</td>
                <td>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

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
