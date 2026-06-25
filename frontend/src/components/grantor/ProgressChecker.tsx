import { useTranslations } from "next-intl";

type RequiredFieldsMap = {
  [key: string]: boolean | RequiredFieldsMap;
};

export const progressType = {
  notStarted: "Not Started",
  inProgress: "In Progress",
  complete: "Complete", // NOT completed, which is not supported at this time
};

// This function checks the dataToCheck for required fields listed
// in the requiredFieldsJson and returns a progressType.
export function checkProgress(
  requiredFields: RequiredFieldsMap,
  dataToCheck: Record<string, unknown>,
) {
  let requiredValuesFound = false;
  let missingRequiredField = false;
  for (const [key, value] of Object.entries(requiredFields)) {
    // console.log(`Key: ${key}, Value: ${value}, data: ${dataToCheck[key]}`);
    if (!dataToCheck[key]) {
      missingRequiredField = true;
    } else {
      if (typeof value === "boolean") {
        requiredValuesFound = true;
      } else {
        // Recursively check nested objects!
        const status = checkProgress(
          value,
          dataToCheck[key] as Record<string, unknown>,
        );
        if (status === progressType.notStarted) {
          // don't update requiredValuesFound here
          // it is already defaulted to false and other values may override it
        }
        if (status === progressType.inProgress) {
          requiredValuesFound = true;
          missingRequiredField = true;
        }
        if (status === progressType.complete) {
          requiredValuesFound = true;
          // don't update missingRequiredField here
          // it is already defaulted to false and other values may override it
        }
      }
    }
  }
  if (!requiredValuesFound) return progressType.notStarted;
  if (requiredValuesFound && missingRequiredField)
    return progressType.inProgress;
  if (requiredValuesFound && !missingRequiredField)
    return progressType.complete;
}

// This function will return an HTML component after checking the progress
export function ProgressChecker({
  requiredFields,
  dataToCheck,
}: {
  requiredFields: RequiredFieldsMap;
  dataToCheck: Record<string, unknown>;
}) {
  const t = useTranslations("ProgressChecker");
  const status = checkProgress(requiredFields, dataToCheck);
  return (
    <>
      {status === progressType.notStarted && (
        <span className="display-inline-block width-15 padding-05 text-center bg-base-dark text-white">
          {t("notStarted")}
        </span>
      )}

      {status === progressType.inProgress && (
        <span className="display-inline-block width-15 padding-05 text-center bg-accent-warm-lightest">
          {t("inProgress")}
        </span>
      )}

      {status === progressType.complete && (
        <span className="display-inline-block width-15 padding-05 text-center bg-primary-lighter">
          {t("complete")}
        </span>
      )}
    </>
  );
}
