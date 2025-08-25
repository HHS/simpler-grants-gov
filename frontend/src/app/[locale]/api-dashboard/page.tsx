import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import Head from "next/head";
import { getTranslations } from "next-intl/server";

import ApiDashboard from "src/components/dev/ApiDashboard";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ApiDashboard" });
  const meta: Metadata = {
    title: t("pageTitle"),
    description: t("metaDescription"),
  };

  return meta;
}

export default function ApiDashboardPage() {
  return (
    <AuthenticationGate>
      <div className="grid-container">
        <ApiDashboard />
      </div>
    </AuthenticationGate>
  );
}
