"use client";

export const buildPathToZipDownload = (opportunityId: string) => {
  return `/api/opportunities/${opportunityId}/attachments-download`;
};

export const downloadAttachmentsZip = (opportunityId: string) => {
  const path = buildPathToZipDownload(opportunityId);
  window.open(path, "_blank");
};
