"server only";

import { CompetitionFormsApiResponse } from "src/types/competitionFormsResponseTypes";

import { fetchCompetitionForms } from "./fetchers";

export async function updateCompetitionForms({
  competitionId,
  body,
}: {
  competitionId: string;
  body: { forms: { form_id: string; is_required: boolean }[] };
}): Promise<CompetitionFormsApiResponse> {
  const response = await fetchCompetitionForms({
    subPath: `${competitionId}/forms`,
    body,
  });

  return (await response.json()) as CompetitionFormsApiResponse;
}
