import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { COMPETITION_ID } from "src/constants/competitions";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";
import { FormDetail } from "src/types/formResponseTypes";

import Link from "next/link";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form demo application landing page`,
  };
  return meta;
}

interface ApplicationLandingPageProps {
  params: Promise<{ applicationId: string; locale: string }>;
}

const FormLinks = ({
  forms,
  applicationId,
}: {
  forms: [{ form: FormDetail }];
  applicationId: string;
}) => {
  if (forms.length > 0) {
    return (
      <ul className="usa-list">
        {forms.map((form) => {
          return (
            <li key={form.form.form_name}>
              <Link
                href={`/formPrototype/${applicationId}/form/${form.form.form_id}`}
              >
                {form.form.form_name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
};

async function ApplicationLandingPage({ params }: ApplicationLandingPageProps) {
  const { applicationId } = await params;
  let forms = [];

  try {
    const response = await getCompetitionDetails(COMPETITION_ID);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving competition details for competitionId (${COMPETITION_ID})`,
        response,
      );
      return <TopLevelError />;
    }
    forms = response.data.competition_forms;
  } catch (e) {
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      console.error(
        `Error retrieving competition details for competitionId (${COMPETITION_ID})`,
        e,
      );
      return <NotFound />;
    }
    return <TopLevelError />;
  }

  return (
    <GridContainer>
      <BetaAlert />
      <h1>Form demo application page</h1>
      <legend className="usa-legend">
        The following is a list of available forms.
      </legend>
      <FormLinks forms={forms} applicationId={applicationId} />
    </GridContainer>
  );
}

export default withFeatureFlag<ApplicationLandingPageProps, never>(
  ApplicationLandingPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
