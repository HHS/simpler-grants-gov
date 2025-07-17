import { Competition } from "src/types/competitionsResponseTypes";

export const clientFetchCompetition = async (
  competitionId: string,
): Promise<Competition> => {
  const res = await fetch(`/api/competitions/${competitionId}`);

  if (res.ok && res.status === 200) {
    const message = (await res.json()) as Competition;
    return message;
  } else {
    throw new Error(`Error fetching competitions: ${res.status}`, {
      cause: `${res.status}`,
    });
  }
};
