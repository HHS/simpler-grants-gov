import { readError } from "src/errors";
import { deleteSavedOpportunityForOrganization } from "src/services/fetch/fetchers/savedOpportunitiesToOrganizationFetcher";

import { NextRequest, NextResponse } from "next/server";

export const deleteSavedOpportunityForOrganizationHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ opportunityId: string; organizationId: string }> },
) => {
  const { opportunityId, organizationId } = await options.params;
  try {
    const deleteOrganization = await deleteSavedOpportunityForOrganization(organizationId, opportunityId);
    return NextResponse.json({ data: deleteOrganization });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
