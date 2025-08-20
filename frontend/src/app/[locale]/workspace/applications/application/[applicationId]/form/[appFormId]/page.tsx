import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import getFormData from "src/utils/getFormData";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import BookmarkBanner from "src/components/BookmarkBanner";
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
    applicationResponse,
    applicationFormData,
    formId,
    formName,
    formSchema,
    formUiSchema,
    formValidationWarnings,
  } = data;

  return (
    <>
      <BookmarkBanner containerClasses="margin-y-3" />
      <GridContainer>
        <Breadcrumbs
          breadcrumbList={[
            { title: "home", path: "/" },
            {
              title: applicationFormData.application_name,
              path: `/workspace/applications/application/${applicationFormData.application_id}`,
            },
            {
              title: "Form",
              path: `/workspace/applications/application/${applicationFormData.application_id}/form/${applicationId}`,
            },
          ]}
        />
        <h1>{formName}</h1>
        <ApplyForm
          applicationId={applicationId}
          validationWarnings={formValidationWarnings}
          savedFormData={applicationResponse}
          formSchema={formSchema}
          uiSchema={formUiSchema}
          formId={formId}
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
