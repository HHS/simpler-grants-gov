import { FormValidationWarning } from "src/components/applyForm/types";
import { getBudgetErrors } from "./budgetErrorLabels";

export const getErrorsForSection =
  (section: "A" | "B" | "C" | "D" | "E" | "F") =>
  ({ errors, id }: { errors: FormValidationWarning[]; id: string }) =>
    getBudgetErrors({ errors, id, section });
