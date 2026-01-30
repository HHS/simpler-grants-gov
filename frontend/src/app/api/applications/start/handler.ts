import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleStartApplication } from "src/services/fetch/fetchers/applicationFetcher";

type StartApplicationHandlerRequestJson = {
  competitionId: string;
  applicationName: string;
  organizationId?: string;
  intendsToAddOrganization?: boolean;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const startApplicationHandler = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session start application");
    }

    const parsedJson =
      (await request.json()) as StartApplicationHandlerRequestJson;

    if (!isNonEmptyString(parsedJson.competitionId)) {
      throw new ApiRequestError(
        "Missing competitionId",
        "BadRequestError",
        400,
      );
    }

    if (!isNonEmptyString(parsedJson.applicationName)) {
      throw new ApiRequestError(
        "Missing Application Name",
        "BadRequestError",
        400,
      );
    }

    const organizationId = isNonEmptyString(parsedJson.organizationId)
      ? parsedJson.organizationId
      : undefined;

    const intendsToAddOrganization =
      typeof parsedJson.intendsToAddOrganization === "boolean"
        ? parsedJson.intendsToAddOrganization
        : undefined;

    const response = await handleStartApplication({
      applicationName: parsedJson.applicationName,
      competitionId: parsedJson.competitionId,
      token: session.token,
      organizationId,
      intendsToAddOrganization,
    });

    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error starting application: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }

    return Response.json({
      message: "Application start success",
      applicationId: response.data.application_id,
    });
  } catch (caughtError: unknown) {
    const { status, message } = readError(caughtError as Error, 500);
    return Response.json(
      { message: `Error attempting to start application: ${message}` },
      { status },
    );
  }
};
