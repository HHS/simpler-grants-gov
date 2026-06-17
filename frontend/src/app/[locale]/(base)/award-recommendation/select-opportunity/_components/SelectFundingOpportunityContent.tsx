"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Table } from "@trussworks/react-uswds";

type FundingOpportunity = {
  id: string;
  opportunityNumber: string;
  opportunityName: string;
};

const fakeFundingOpportunities: FundingOpportunity[] = [
  {
    id: "1",
    opportunityNumber: "FO-26-00001",
    opportunityName: "Salute to America 250 – Outreach Across Japan",
  },
  {
    id: "2",
    opportunityNumber: "FO-26-00001",
    opportunityName: "ACL National Falls Prevention Resource Center",
  },
  {
    id: "3",
    opportunityNumber: "FO-26-00001",
    opportunityName: "U.S. Embassy Port Louis Public Diplomacy Small ...",
  },
];

export const SelectFundingOpportunityContent = () => {
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
            <th scope="col">{t("columns.action")}</th>
          </tr>
        </thead>
        <tbody>
          {fakeFundingOpportunities.map((fundingOpportunity) => (
            <tr key={fundingOpportunity.id}>
              <td>
                <Link
                  href={`/funding-opportunities/${fundingOpportunity.id}`}
                  className="usa-link"
                >
                  {fundingOpportunity.opportunityNumber}
                </Link>
              </td>
              <td>{fundingOpportunity.opportunityName}</td>
              <td>
                <Button
                  type="button"
                  className="usa-button--outline margin-y-0"
                  onClick={() =>
                    handleCreateAwardRecommendation(fundingOpportunity.id)
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