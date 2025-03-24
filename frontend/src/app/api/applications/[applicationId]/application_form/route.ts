// NOTE: this route is only for testing, will be removed when API is ready
// TODO: remove file
import { readError } from "src/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ applicationId: string; appFormId: string }> },
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { applicationId, appFormId } = await params;

  const { application_response } = (await request.json()) as {
    application_response: object;
  };

  console.error(application_response, applicationId, appFormId);

  try {
    const response = {
      data: {
        application_id: applicationId,
      },
      warnings: [],
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error fetching saved opportunity: ${message}`,
      },
      { status },
    );
  }
}
