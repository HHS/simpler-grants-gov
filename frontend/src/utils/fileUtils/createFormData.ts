export const createFormDataForFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return createFormData(file.name, buffer, file.type);
};

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
