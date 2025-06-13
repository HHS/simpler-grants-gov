import * as zip from "@zip.js/zip.js";
import { ApiRequestError, readError } from "src/errors";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { deduplicateFilenames } from "src/utils/opportunity/zipDownloadUtils";

import { NextRequest, NextResponse } from "next/server";

export async function getAttachmentsDownload(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> },
): Promise<Response> {
  const { opportunityId } = await params;
  try {
    const getOpportunity = await getOpportunityDetails(opportunityId);

    if (!getOpportunity || getOpportunity.status_code !== 200) {
      throw new ApiRequestError(
        `Error fetching Opportunity: ${getOpportunity.message}`,
        "APIRequestError",
        getOpportunity.status_code,
      );
    }

    if (
      !getOpportunity.data.attachments ||
      !getOpportunity.data.attachments.length
    ) {
      return NextResponse.json(
        {
          message: `No files for Opportunity`,
          opportunityId,
        },
        { status: 404 },
      );
    }
    const blobWriter = new zip.BlobWriter();
    const zipWriter = new zip.ZipWriter(blobWriter);
    // const deduplicatedFilenames = deduplicateFilenames(getOpportunity.data.attachments);
    // const zippedFilenames = {} as { [key:string]: number}
    const zipEntries = attachmentsToZipEntries(getOpportunity.data.attachments);
    const addPromises = zipEntries.map((entry) => {
      return zipWriter.add(...entry);
      // const currentFilenameCount = zippedFilenames[attachment.file_name];
      // const zipFilename = currentFilenameCount > 1 ? `${attachment.file_name}` : attachment.file_name
      // return zipWriter.add(
      //   attachment.file_name,
      //   new zip.HttpReader(attachment.download_path),
      // );
    });

    await Promise.all([...addPromises, zipWriter.close()]);

    const blobData = await blobWriter.getData();
    return new NextResponse(blobData, {
      status: 200,
      headers: new Headers({
        "Content-Disposition": `attachment; filename="opportunity-${getOpportunity.data?.opportunity_number || opportunityId}-attachments.zip"`,
      }),
    });
  } catch (e) {
    console.error(e);
    const { status, message } = readError(e as Error, 500);
    return NextResponse.json(
      {
        message: `Error zipping files for Opportunity: ${message}`,
        opportunityId,
      },
      { status },
    );
  }
}
