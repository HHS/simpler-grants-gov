export const createFormData = (
  filename: string,
  buffer: Buffer,
  mimeType: string,
) => {
  const form = new FormData();
  const file = new File([buffer] as BlobPart[], filename, { type: mimeType });
  form.append("file_attachment", file);
  return form;
};
