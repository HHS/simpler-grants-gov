import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import NotFound from "src/app/[locale]/(base)/not-found";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import getFormData from "src/utils/getFormData";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import {
  buildWarningTree,
  pointerToFieldName,
} from "src/components/applyForm/utils";
import Breadcrumbs from "src/components/Breadcrumbs";

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
    title = formName;
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

  if (error || !data) {
    if (error === "UnauthorizedError") return redirect("/unauthenticated");
    if (error === "NotFound") return <NotFound />;
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
      <GridContainer className="overflow-auto maxh-viewport">
        <Breadcrumbs
          breadcrumbList={[
            { title: "home", path: "/" },
            {
              title: applicationName,
              path: `/workspace/applications/application/${applicationId}`,
            },
            {
              title: formName,
              path: `/workspace/applications/application/${applicationId}/form/${formId}`,
            },
          ]}
        />
        <h1>{formName}</h1>
        <ApplyForm
          applicationId={applicationId}
          validationWarnings={warnings || null}
          savedFormData={applicationResponse}
          formSchema={formSchema}
          uiSchema={formUiSchema}
          formId={formId}
          attachments={applicationAttachments}
          isBudgetForm={isBudgetForm}
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
