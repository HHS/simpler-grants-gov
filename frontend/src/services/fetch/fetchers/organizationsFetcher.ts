import { Organization } from "src/types/applicationResponseTypes";
import { fakeOrganizationDetailsResponse } from "src/utils/testing/fixtures";

export const getOrganizationDetails = async (
  _token: string,
  _userId: string,
  _organizationId: string,
): Promise<Organization> => {
  return Promise.resolve(fakeOrganizationDetailsResponse);
};
