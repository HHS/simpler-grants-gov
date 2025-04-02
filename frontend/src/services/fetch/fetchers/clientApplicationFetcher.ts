"use client";
export const startApplication = async (token?: string) => {
  if (!token) return;

  const res = await fetch("/api/applications/start", {
    method: "POST",
  });
  console.log(res);
  if (res.ok && res.status === 200) {
    const data = (await res.json()) as { id: string };
    return data;
  } else {
    console.log(res);
    throw new Error(`Error posting saved search: ${res.status}`);
  }
};
