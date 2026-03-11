import { ApiRequestError, readError } from "src/errors";
import { addSavedOpportunityForOrganization } from "src/services/fetch/fetchers/addSavedOpportunityForOrganization";

// import { NextRequest, NextResponse } from "next/server";

export async function addSavedOpportunityForOrganizationHandler (
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
): Promise<Response> {
  const { organizationId } = await params;
  try {
    const saveOrganizations = await addSavedOpportunityForOrganization(organizationId);

    if (!saveOrganizations || saveOrganizations.status_code !== 200) {
      throw new ApiRequestError(
        `Error fetching Organizations: ${saveOrganizations.message}`,
        "APIRequestError",
        saveOrganizations.status_code,
      );
    }

    // if (
    //   !getOpportunity.data.attachments ||
    //   !getOpportunity.data.attachments.length
    // ) {
    //  return NextResponse.json(
    //    {
    //      message: `No files for Opportunity`,
    //      opportunityId,
    //    },
    //    { status: 404 },
    //  );
    // }
    // const blobWriter = new zip.BlobWriter();
    // const zipWriter = new zip.ZipWriter(blobWriter);
    // const zipEntries = attachmentsToZipEntries(getOpportunity.data.attachments);
    // const addPromises = zipEntries.map((entry) => {
    //   return zipWriter.add(...entry);
    // });

    // await Promise.all([...addPromises, zipWriter.close()]);

    // const blobData = await blobWriter.getData();
    // return new NextResponse(blobData, {
    //  status: 200,
    //  headers: new Headers({
    //    "Content-Disposition": `attachment; filename="opportunity-${getOpportunity.data?.opportunity_number || opportunityId}-attachments.zip"`,
    //  }),
    // });
  } catch (e) {
    console.error(e);
    const { status, message } = readError(e as Error, 500);
    return NextResponse.json(
      {
        message: `Error zipping files for Organizations: ${message}`,
        organizationId,
      },
      { status },
    );
  }
}
