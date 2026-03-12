import { readError } from "src/errors";
import { addSavedOpportunityForOrganization } from "src/services/fetch/fetchers/savedOpportunitiesToOrganizationFetcher";

import { NextRequest, NextResponse } from "next/server";

export const addSavedOpportunityForOrganizationHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ organizationId: string }> },
) => {
  const { organizationId } = await options.params;
  try {
    const saveOrganizations = await addSavedOpportunityForOrganization(organizationId);
    return NextResponse.json({ data: saveOrganizations });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
