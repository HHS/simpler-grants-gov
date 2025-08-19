import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleUpdateApplicationFormIncludeInSubmission } from "src/services/fetch/fetchers/applicationFetcher";

export const updateApplicationIncludeFormInSubmissionHandler = async (
  request: Request,
  { params }: { params: Promise<{ applicationId: string; formId: string }> },
) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError(
        "No active session to update including form in application submission",
      );
    }
    const applicationId = (await params).applicationId;
    const formId = (await params).formId;
    const { is_included_in_submission } = (await request.json()) as {
      is_included_in_submission: boolean;
    };

    const response = await handleUpdateApplicationFormIncludeInSubmission(
      applicationId,
      formId,
      is_included_in_submission,
      session.token,
    );
    const status = response.status_code;
    if (!response || status !== 200) {
      throw new ApiRequestError(
        `Error updating application to include form in submission: ${response.message}`,
        "APIRequestError",
        status,
      );
    }
    return Response.json({
      message:
        status === 200
          ? "Application form inclusions update submit success"
          : "Validation errors for updating  application",
      is_included_in_submission: response?.data?.is_included_in_submission,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    const errorMessage = `Error attempting to update include form in application submission application: ${message}`;
    return Response.json({ message: errorMessage }, { status });
  }
};
