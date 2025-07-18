/**
 * @jest-environment node
 */

import { getCompetition } from "src/app/api/competitions/[competitionId]/handler";

describe("competitions/[competitionId] GET requests", () => {
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
