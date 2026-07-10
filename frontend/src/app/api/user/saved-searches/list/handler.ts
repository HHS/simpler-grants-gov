import { readError } from "src/errors";
import { fetchSavedSearches } from "src/services/fetch/fetchers/savedSearchFetcher";

export const listSavedSearches = async (_request: Request) => {
  try {
    const savedSearches = await fetchSavedSearches();

    return new Response(JSON.stringify(savedSearches), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch saved searches: ${message}`,
      },
      { status },
    );
  }
};
