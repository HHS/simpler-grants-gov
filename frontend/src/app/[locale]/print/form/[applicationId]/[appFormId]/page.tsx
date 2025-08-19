import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { environment } from "src/constants/environments";
import getFormData from "src/utils/getFormData";

import { notFound } from "next/navigation";

import PrintForm from "src/components/applyForm/PrintForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string; appFormId: string; locale: string }>;
}) {
  const { applicationId, appFormId } = await params;
  let title = "";
  const { data, error } = await getFormData({ applicationId, appFormId });

  if (error || !data) {
    if (error === "NotFound") return notFound();
    return <TopLevelError />;
  }

  const { formName } = data;
  title = formName;
  const meta: Metadata = {
    title,
  };
  return meta;
}

interface formPageProps {
  params: Promise<{ appFormId: string; applicationId: string; locale: string }>;
}

export default async function FormPage({ params }: formPageProps) {
  const { applicationId, appFormId } = await params;

  const { data, error } = await getFormData({
    applicationId,
    appFormId,
    internalToken: environment.INTERNAL_API_JWT_TOKEN,
  });

  if (error || !data) {
    if (error === "NotFound") return <NotFound />;
    return <TopLevelError />;
  }

  const { applicationResponse, formName, formSchema, formUiSchema } = data;

  return (
    <>
      <h1>{formName}</h1>
      <PrintForm
        savedFormData={applicationResponse}
        formSchema={formSchema}
        uiSchema={formUiSchema}
      />
    </>
  );
}
