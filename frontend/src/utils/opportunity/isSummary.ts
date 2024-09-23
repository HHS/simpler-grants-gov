import { Summary } from "src/types/opportunity/opportunityResponseTypes";

export function isSummary(value: unknown): value is Summary {
  if (typeof value === "object" && value !== null) {
    return "additional_info_url" in value;
  }
  return false;
}
