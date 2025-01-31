import { ReadonlyURLSearchParams } from "next/navigation";

export const downloadSearchResultsCSV = async (
  searchParams: ReadonlyURLSearchParams,
) => {
  try {
    const response = await fetch(
      `/api/search/export?${searchParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Unsuccessful csv download. ${response.status}`);
    }
    const csvBlob = await response.blob();
    location.assign(
      URL.createObjectURL(new Blob([csvBlob], { type: "data:text/csv" })),
    );
  } catch (e) {
    console.error(e);
  }
};
