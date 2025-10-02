import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import NotFound from "src/app/[locale]/(base)/not-found";
import getFormData from "src/utils/getFormData";

import { headers } from "next/headers";

import PrintForm from "src/components/applyForm/PrintForm";
import { addPrintWidgetToFields } from "src/components/applyForm/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string; appFormId: string; locale: string }>;
}) {
  const { applicationId, appFormId } = await params;
  let title = "";
  const headersList = await headers();
  const internalToken = headersList.get("X-SGG-Internal-Token") ?? undefined;

  if (internalToken) {
    const { data } = await getFormData({
      applicationId,
      appFormId,
      internalToken,
    });

    if (data) {
      const { formName } = data;
      title = formName;
    }
  }

  const meta: Metadata = {
    title,
  };
  return meta;
}

interface FormPageProps {
  params: Promise<{
    appFormId: string;
    applicationId: string;
    locale: string;
    setAttachmentsChanged: (value: boolean) => void;
  }>;
}

export default async function FormPage({ params }: FormPageProps) {
  const { applicationId, appFormId, setAttachmentsChanged } = await params;
  const headersList = await headers();
  const internalToken = headersList.get("X-SGG-Internal-Token") ?? undefined;

  if (internalToken === undefined) {
    console.error("Internal token not supplied");
    return <TopLevelError />;
  }

  const { data, error } = await getFormData({
    applicationId,
    appFormId,
    internalToken,
  });

  if (error || !data) {
    if (error === "NotFound") return <NotFound />;
    return <TopLevelError />;
  }

  const {
    applicationResponse,
    formName,
    formSchema,
    formUiSchema,
    applicationAttachments,
  } = data;

  const modifiedUiSchema = addPrintWidgetToFields(formUiSchema);

  return (
    <>
      <h1>{formName}</h1>
      <PrintForm
        savedFormData={applicationResponse}
        formSchema={formSchema}
        uiSchema={modifiedUiSchema}
        attachments={applicationAttachments}
        setAttachmentsChanged={setAttachmentsChanged}
      />
    </>
  );
}
