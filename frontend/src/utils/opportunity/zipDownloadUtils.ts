"use client";

export const buildPathToZipDownload = (opportunityId: number) => {
  return `/api/opportunities/${opportunityId}/attachments-download`;
};

export const downloadAttachmentsZip = (opportunityId: number) => {
  const path = buildPathToZipDownload(opportunityId);
  window.open(path, "_blank");
};
