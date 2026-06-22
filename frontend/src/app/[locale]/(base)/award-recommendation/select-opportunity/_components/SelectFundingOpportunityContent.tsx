"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Table } from "@trussworks/react-uswds";

import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

type SelectFundingOpportunityContentProps = {
  fundingOpportunities: BaseOpportunity[];
};

export const SelectFundingOpportunityContent = ({
  fundingOpportunities,
}: SelectFundingOpportunityContentProps) => {
  const t = useTranslations("AwardRecommendationSelectFundingOpportunity");
  const router = useRouter();

  const handleCancel = () => {
    router.push("/");
  };

  const handleCreateAwardRecommendation = (fundingOpportunityId: string) => {
    router.push(
      `/award-recommendations/create?fundingOpportunityId=${fundingOpportunityId}`,
    );
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
          {fundingOpportunities.map((fundingOpportunity) => (
            <tr key={fundingOpportunity.opportunity_id}>
              <td>
                <Link
                  href={`/funding-opportunities/${fundingOpportunity.opportunity_id}`}
                  className="usa-link"
                >
                  {fundingOpportunity.opportunity_number}
                </Link>
              </td>
              <td>{fundingOpportunity.opportunity_title}</td>
              <td>0</td>
              <td>
                <Button
                  type="button"
                  className="usa-button--outline margin-y-0"
                  onClick={() =>
                    handleCreateAwardRecommendation(
                      fundingOpportunity.opportunity_id,
                    )
                  }
                >
                  {t("startButtonText")} <span aria-hidden="true">→</span>
                </Button>
              </td>
            </tr>
          ))}
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