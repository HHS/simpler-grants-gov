"use server";

import OpportunityListingAPI from "src/app/api/OpportunityListingAPI";

import { OpportunityHistorySkeleton } from "./OpportunityHistorySkeleton";

const OpportunityHistory = async ({ id }: { id: number }) => {
  const api = new OpportunityListingAPI();
  let summary;
  try {
    const response = await api.getOpportunityById(id);
    summary = response.data.summary;
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    throw new Error("Failed to fetch opportunity");
  }

  return <OpportunityHistorySkeleton summary={summary} />;
};

export default OpportunityHistory;
