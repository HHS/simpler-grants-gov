/*
  Convert between the formats that name a value. JSON Forms uses a data path with array
  indexes as segments (`people.0.bio`); the SGG widgets, saving and validation each use a
  different format.
*/

// JSON Forms leaves the path undefined at the form's root.
const segments = (path: string | undefined): string[] =>
  (path ?? "").split(".").filter(Boolean);

const isIndex = (segment: string): boolean => /^\d+$/.test(segment);

/** Return whether a data path is inside a list entry, i.e. it has an index segment. */
export const hasListIndex = (path: string): boolean =>
  segments(path).some(isIndex);

/** Convert `people.0.bio` to `/properties/people/items/properties/bio`, the value's JSON schema definition. */
export const dataPathToDefinition = (path: string): string =>
  segments(path)
    .map((segment) => (isIndex(segment) ? "/items" : `/properties/${segment}`))
    .join("");

/**
 * Convert `people.0.bio` to `people[0]--bio`, the HTML field name the save action shapes back
 * into `people[0].bio`. Add an index for each list level: `a.0.b.1.c` -> `a[0]--b[1]--c`.
 */
export const dataPathToHtmlName = (path: string): string =>
  segments(path).reduce(
    (name, segment) =>
      isIndex(segment)
        ? `${name}[${segment}]`
        : name
          ? `${name}--${segment}`
          : segment,
    "",
  );

/** Convert `people.0.bio` to `$.people[0].bio`, the path format of the API's validation warnings. */
export const dataPathToWarningPath = (path: string): string =>
  `$${segments(path)
    .map((segment) => (isIndex(segment) ? `[${segment}]` : `.${segment}`))
    .join("")}`;

/** Return the segments of `path` beneath `basePath`: `people.0.name.first` in `people.0` -> `name,first`. */
export const relativeSegments = (path: string, basePath: string): string[] =>
  segments(path).slice(segments(basePath).length);

/**
 * Return the data path of a field a control renders: the control's path, plus the properties
 * from the control's definition down to the field's, e.g. `people.0.name` + `first`.
 */
export const fieldDataPath = (
  controlPath: string,
  definition: string,
): string =>
  [
    ...segments(controlPath),
    ...definition
      .slice(dataPathToDefinition(controlPath).length)
      .split("/")
      .filter((segment) => segment && segment !== "properties"),
  ].join(".");
