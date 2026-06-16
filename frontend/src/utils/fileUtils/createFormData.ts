export const createFormData = (
  filename: string,
  buffer: Buffer,
  mimeType: string,
  key = "file_attachment",
) => {
  const formData = new FormData();
  const file = new File([buffer] as BlobPart[], filename, { type: mimeType });
  formData.append(key, file);
  return formData;
};
