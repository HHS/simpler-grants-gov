export async function uploadFileToApp(
  applicationId: string,
  file: File
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`/api/applications/${applicationId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    return data.application_attachment_id ?? null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}
