// based on https://github.com/ArturKot95/FormData2Json/blob/main/src/formDataToObject.ts

type NestedObject = {
  [key: string]:
    | NestedObject
    | NestedObject[]
    | (object | string | boolean | number | null);
};

type FormDataToJsonOptions = {
  parentKey?: string;
  delimiter?: string;
};

export function formDataToObject(
  formData = new FormData(),
  options?: FormDataToJsonOptions,
): NestedObject {
  const delimiter = options?.delimiter || ".";
  const { parentKey } = options ?? { parentKey: "" };
  const result: NestedObject = {};
  const entries = formData.entries();

  for (const [key, value] of entries) {
    const currentKey = parentKey ? `${parentKey}${delimiter}${key}` : key;
    const chunks = currentKey.split(delimiter);
    let current = result;
    const parsedValue = (() => {
      if (value === "false") return false;
      if (value === "true") return true;
      if (
        value !== "" &&
        value !== null &&
        value !== undefined &&
        !isNaN(Number(value))
      )
        return Number(value);
      return value;
    })();

    const chunksLen = chunks.length;
    for (let chunkIdx = 0; chunkIdx < chunksLen; chunkIdx++) {
      const chunkName = chunks[chunkIdx];
      const isArray = chunkName.endsWith("]");

      if (isArray) {
        const indexStart = chunkName.indexOf("[");
        const indexEnd = chunkName.indexOf("]");

        const arrayIndex = parseInt(
          chunkName.substring(indexStart + 1, indexEnd),
        );

        if (isNaN(arrayIndex)) {
          throw new Error(
            `wrong form data - cannot retrieve array index ${arrayIndex}`,
          );
        }

        const actualChunkName = chunkName.substring(0, indexStart);
        const currentValue =
          (current[actualChunkName] as NestedObject[]) ??
          ([] as NestedObject[]);

        current[actualChunkName] = currentValue;

        // const currentChunk: NestedObject[] = current[actualChunkName];
        if (chunkIdx === chunks.length - 1) {
          current[actualChunkName][arrayIndex] = parsedValue;
        } else {
          current[actualChunkName][arrayIndex] =
            current[actualChunkName][arrayIndex] ?? {};
          current = current[actualChunkName][arrayIndex] as NestedObject;
        }
      } else {
        if (chunkIdx === chunks.length - 1) {
          current[chunkName] = parsedValue;
        } else {
          current[chunkName] = current[chunkName] ?? {};
          current = current[chunkName] as NestedObject;
        }
      }
    }
  }

  return result;
}
