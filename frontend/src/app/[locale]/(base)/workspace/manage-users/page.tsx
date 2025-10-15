import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  let title = `${t("ManageUsers.pageTitle")}`;
  try {
    const session = await getSession();
    if (!session?.token) {
      throw new Error("not logged in");
    }
  } catch (error) {
    console.error("Failed to render page title due to API error", error);
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return notFound();
    }
  }
  return {
    title,
    description: t("Index.metaDescription"),
  };
}

async function ManageUsers() {
  const t = await getTranslations("ManageUsers");

  const session = await getSession();
  if (!session?.token) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <div>not logged in</div>
      </GridContainer>
    );
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{t("pageHeading")}</h1>
    </GridContainer>
  );
}

export default withFeatureFlag<null, never>(ManageUsers, "userAdminOff", () =>
  redirect("/maintenance"),
);
