import { Metadata } from "next";

import Head from "next/head";


import ApiDashboard from "src/components/dev/ApiDashboard";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export function generateMetadata() {
  const meta: Metadata = {
    title: "API Dashboard | Simpler.Grants.gov",
    description: "Manage your API keys for Simpler.Grants.gov",
  };

  return meta;
}

/**
 * View for managing API keys
 */
export default function ApiDashboardPage() {
  return (
    <AuthenticationGate>
      <Head>
        <title>API Dashboard</title>
      </Head>
      <div className="grid-container">
        <ApiDashboard />
      </div>
    </AuthenticationGate>
  );
}
