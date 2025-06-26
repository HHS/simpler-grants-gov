/**
 * @jest-environment node
 */

import { getAttachmentsDownload } from "src/app/api/opportunities/[opportunityId]/attachments-download/handler";
import { fakeAttachments } from "src/utils/testing/fixtures";

import { NextRequest } from "next/server";

const fakeRequestForOpportunity = () => {
  return {} as NextRequest;
};

const paramForAttachment = "43";
const paramForNoAttachments = "87";

const mockGetOpportunityDetails = jest.fn((params: string): unknown => {
  let returnVal;
  if (params === paramForAttachment) {
    returnVal = {
      data: {
        attachments: fakeAttachments,
      },
      status_code: 200,
      message: "Success",
      params,
    };
  }
  if (params === paramForNoAttachments) {
    returnVal = {
      data: {
        attachments: [],
      },
      status_code: 200,
      message: "Success",
      params,
    };
  }

  const intParam = parseInt(params);
  if (intParam < 0) {
    returnVal = {
      data: null,
      status_code: -intParam,
      message: "Failure",
      params,
    };
  }
  return returnVal;
});

const mockAttachmentsToZipEntries = jest.fn();

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: (params: string) => mockGetOpportunityDetails(params),
}));

jest.mock("src/utils/opportunity/zipUtils", () => ({
  attachmentsToZipEntries: () => mockAttachmentsToZipEntries() as unknown,
}));

describe("attachments-download export GET requests", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls opportunityDetails with expected arguments", async () => {
    await getAttachmentsDownload(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "43",
      }),
    });
    expect(mockGetOpportunityDetails).toHaveBeenCalledWith(paramForAttachment);
  });

  it("returns a new response with zip data", async () => {
    mockAttachmentsToZipEntries.mockReturnValue([]);
    const response = await getAttachmentsDownload(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "43",
      }),
    });
    expect(response.status).toEqual(200);

    expect(response.headers.get("Content-Disposition")).toEqual(
      `attachment; filename="opportunity-${paramForAttachment}-attachments.zip"`,
    );
    expect(response.body?.locked).toEqual(false);
  });

  it("returns a new response when no attachments", async () => {
    const response = await getAttachmentsDownload(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: paramForNoAttachments,
      }),
    });
    expect(response.status).toEqual(404);
    expect(response.headers.get("Content-Disposition")).toBeNull();

    expect(response.body?.locked).toEqual(false);
  });

  it("returns a new response with with error if error on data fetch", async () => {
    const response = await getAttachmentsDownload(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "-500",
      }),
    });
    expect(response.status).toEqual(500);
  });

  it("returns a new response with with error if data is missing", async () => {
    const response = await getAttachmentsDownload(fakeRequestForOpportunity(), {
      params: Promise.resolve({
        opportunityId: "-404",
      }),
    });
    expect(response.status).toEqual(404);
  });
});
