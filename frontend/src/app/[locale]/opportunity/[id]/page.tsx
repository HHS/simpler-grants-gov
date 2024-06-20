import {
  ApiResponse,
  Summary,
} from "../../../../types/opportunity/opportunityResponseTypes";

import { Metadata } from "next";
import NotFound from "../../../not-found";
import OpportunityListingAPI from "../../../api/OpportunityListingAPI";
import { getTranslations } from "next-intl/server";
import { isSummary } from "../../../../utils/opportunity/isSummary";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("OpportunityListing.page_title"),
    description: t("OpportunityListing.meta_description"),
  };
  return meta;
}

export default async function OpportunityListing({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  // Opportunity id needs to be a number greater than 1
  if (isNaN(id) || id < 0) {
    return <NotFound />;
  }

  const api = new OpportunityListingAPI();
  let opportunity: ApiResponse;
  try {
    opportunity = await api.getOpportunityById(id);
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    return <NotFound />;
  }

  if (!opportunity.data) {
    return <NotFound />;
  }

  const renderSummary = (summary: Summary) => {
    return (
      <>
        {Object.entries(summary).map(([summaryKey, summaryValue]) => (
          <tr key={summaryKey}>
            <td className="word-wrap">{`summary.${summaryKey}`}</td>
            <td className="word-wrap">{JSON.stringify(summaryValue)}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="grid-container">
      <div className="grid-row margin-y-4">
        <div className="usa-table-container">
          <table className="usa-table usa-table--borderless margin-x-auto width-full maxw-desktop-lg">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(opportunity.data).map(([key, value]) => {
                if (key === "summary" && isSummary(value)) {
                  return renderSummary(value);
                } else {
                  return (
                    <tr key={key}>
                      <td className="word-wrap">{key}</td>
                      <td className="word-wrap">{JSON.stringify(value)}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
