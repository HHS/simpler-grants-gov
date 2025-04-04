import { randomUUID } from "crypto";
import * as zip from "@zip.js/zip.js";
import { ApiRequestError, readError } from "src/errors";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> },
): Promise<Response> {
  const { opportunityId } = await params;
  try {
    const response = await getOpportunityDetails(opportunityId);

    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error fetching Opportunity: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }

    if (response.data.attachments?.length === 0) {
      return Response.json(
        {
          message: `No files for Opportunity`,
          opportunityId,
        },
        { status: 404 },
      );
    }
    const zipWriter = new zip.ZipWriterStream();

    const closeWriter = async () => {
      await zipWriter.close();
    };

    Promise.allSettled(
      response.data.attachments?.map((attachment) => {
        return new zip.HttpReader(attachment.download_path).readable
          .pipeTo(zipWriter.writable(attachment.file_name))

          .catch((e: Error) => {
            const uuid = randomUUID();
            console.error(
              "Error fetching file",
              attachment.download_path,
              uuid,
            );
            throw new Error(`${e.message}, ${uuid}`);
          });
      }),
    )
      .catch((e) => {
        console.error("Error while streaming", e);
      })
      .finally(() => {
        closeWriter().catch((e) => {
          throw e;
        });
      });

    return new NextResponse(zipWriter.readable, {
      status: 200,
      headers: new Headers({
        "Content-Disposition": `attachment; filename="opportunity-${response.data?.opportunity_number || opportunityId}-attachments.zip"`,
      }),
    });
  } catch (e) {
    console.error(e);
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error zipping files for Opportunity: ${message}`,
        opportunityId,
      },
      { status },
    );
  }
}
