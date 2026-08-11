// #11350 - forms whose single Attachment fields use the virus scanning input
const SINGLE_ATTACHMENT_FORM_NAMES: ReadonlySet<string> = new Set([
  "Attachment Form",
]);

// #11351 - forms whose AttachmentArray fields use the virus scanning input
const MULTI_ATTACHMENT_FORM_NAMES: ReadonlySet<string> = new Set([
  "Application for Federal Assistance (SF-424)",
]);

export const supportsSingleAttachmentVirusScanning = (
  formName: string | undefined,
): boolean => (formName ? SINGLE_ATTACHMENT_FORM_NAMES.has(formName) : false);

export const supportsMultiAttachmentVirusScanning = (
  formName: string | undefined,
): boolean => (formName ? MULTI_ATTACHMENT_FORM_NAMES.has(formName) : false);
