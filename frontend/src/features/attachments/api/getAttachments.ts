import { Attachment } from "src/types/attachmentTypes";

interface GetAttachmentsProps {
  applicationId: string;
}

export const getAttachments = async ({
  applicationId,
}: GetAttachmentsProps): Promise<Attachment[]> => {
  const res = await fetch(`/api/applications/${applicationId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return (await res.json()) as Attachment[];
};
