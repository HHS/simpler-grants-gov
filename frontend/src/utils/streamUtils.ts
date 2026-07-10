const tempChunkSeparator = "~~~~~~~";

// in a case where a chunk comes in with a string composed of multiple json strings due to batching queues:
// ex. "{ key: 'value1'}{ key: 'value2'}"
// separate that into an array of json strings
export const unbatchStreamChunkJSON = (streamChunkJson: string): string[] => {
  return streamChunkJson
    .replace(/}\s*{/, `}${tempChunkSeparator}{`)
    .split(tempChunkSeparator);
};
