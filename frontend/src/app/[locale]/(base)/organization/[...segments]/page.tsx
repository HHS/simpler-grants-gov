import { permanentRedirect } from "next/navigation";
import { use } from "react";

export default function RedirectOrganizationPage({
  params,
}: {
  params: Promise<{ segments: string }>;
}) {
  const { segments } = use(params);
  return permanentRedirect(`/organizations/${segments}`);
}
