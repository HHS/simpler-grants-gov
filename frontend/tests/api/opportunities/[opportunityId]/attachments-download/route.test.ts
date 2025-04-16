/**
 * @jest-environment node
 */

import { GET } from "src/app/api/opportunities/[opportunityId]/attachments-download/route";

import { NextRequest } from "next/server";

const fakeRequestForOpportunity = () => {
  return {} as NextRequest;
};

const fakeConvertedParams = "43";

const mockGetOpportunityDetails = jest.fn((params: unknown): unknown => ({
  data: {
    attachments: [
      {
        created_at: "2007-11-02T15:23:09+00:00",
        download_path:
          "https://d3t9pc32v5noin.cloudfront.net/opportunities/40009/attachments/25293/YLP_Algeria_RFGP_09-28-07_EDITED.doc",
        file_description: "Announcement",
        file_name: "YLP_Algeria_RFGP_09-28-07_EDITED.doc",
        file_size_bytes: 111616,
        mime_type: "application/msword",
        updated_at: "2007-11-02T15:23:09+00:00",
      },
      {
        created_at: "2007-11-02T15:23:10+00:00",
        download_path:
          "https://d3t9pc32v5noin.cloudfront.net/opportunities/40009/attachments/25294/YLP_Algeria_POGI_09-26-07_EDITED.doc",
        file_description: "Mandatory POGI",
        file_name: "YLP_Algeria_POGI_09-26-07_EDITED.doc",
        file_size_bytes: 122880,
        mime_type: "application/msword",
        updated_at: "2007-11-02T15:23:10+00:00",
      },
    ],
  },
  status_code: 200,
  message: "Success",
  params,
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: (params: unknown) => mockGetOpportunityDetails(params),
}));

describe("attachments-download export GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls opportunityDetails with expected arguments", async () => {
    await GET(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "43",
      }),
    });
    expect(mockGetOpportunityDetails).toHaveBeenCalledWith(fakeConvertedParams);
  });

  it("returns a new response created from the returned value of downloadOpportunties", async () => {
    const response = await GET(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "43",
      }),
    });
    expect(response.status).toEqual(200);
    expect(response.headers.get("Content-Disposition")).toEqual(
      `attachment; filename="opportunity-43-attachments.zip"`,
    );
    expect(response.body?.locked).toEqual(false);
  });
});
