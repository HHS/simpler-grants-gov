import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import ApplyForm from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/_components/ApplyForm";
import { ApiRequestError } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import {
  buildWarningTree,
  pointerToFieldName,
} from "src/utils/applyForm/applyFormUtils";
import getFormData from "src/utils/getFormData";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string; appFormId: string; locale: string }>;
}) {
  const { applicationId, appFormId } = await params;
  let title = "";
  const { data } = await getFormData({ applicationId, appFormId });

  if (data) {
    const { formName } = data;
    title = `${formName} | Simpler.Grants.gov`;
  } else {
    title = "Application form | Simpler.Grants.gov";
  }
  const meta: Metadata = {
    title,
    description: "Follow instructions to complete this form.",
  };
  return meta;
}

interface formPageProps {
  params: Promise<{ appFormId: string; applicationId: string; locale: string }>;
}

async function FormPage({ params }: formPageProps) {
  const { applicationId, appFormId } = await params;
  const { data, error } = await getFormData({ applicationId, appFormId });
  const t = await getTranslations("Application");

  let response;
  try {
    response = await getApplicationDetails(applicationId);

    if (response.status_code !== 200) {
      throw new ApiRequestError(
        "API request error",
        "APIRequestError",
        response.status_code,
      );
    }
  } catch (e) {
    console.error(
      `Error retrieving application details for (${applicationId})`,
      e,
    );
    return <TopLevelError />;
  }

  const { application_status } = response.data;

  if (error || !data) {
    if (error === "UnauthorizedError") return redirect("/unauthenticated");
    if (error === "NotFound") notFound();
    return <TopLevelError />;
  }

  const {
    applicationName,
    applicationAttachments,
    applicationResponse,
    formId,
    formName,
    formSchema,
    formUiSchema,
    formValidationWarnings,
    createdAt,
    updatedAt,
  } = data;

  const isBudgetForm = formName.includes("SF-424A");

  const warnings = isBudgetForm
    ? formValidationWarnings?.map((warning) => ({
        ...warning,
        field: pointerToFieldName(warning.field),
      }))
    : formValidationWarnings
      ? buildWarningTree(formUiSchema, null, formValidationWarnings, formSchema)
      : [];

  return (
    <>
      <GridContainer>
        <Breadcrumbs
          breadcrumbList={[
            {
              title: t("breadcrumbWorkspace"),
              path: `/workspace`,
            },
            {
              title: t("breadcrumbApplications"),
              path: `/workspace/applications`,
            },
            {
              title: applicationName,
              path: `/workspace/applications/${applicationId}`,
            },
            {
              title: formName,
            },
          ]}
        />
        <h1 className="margin-top-0">{formName}</h1>
        <ApplyForm
          applicationId={applicationId}
          validationWarnings={warnings || null}
          savedFormData={applicationResponse}
          formSchema={formSchema}
          uiSchema={formUiSchema}
          formId={formId}
          attachments={applicationAttachments}
          isBudgetForm={isBudgetForm}
          applicationStatus={application_status}
          createdAt={createdAt}
          updatedAt={updatedAt}
        />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<formPageProps, never>(
  FormPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
