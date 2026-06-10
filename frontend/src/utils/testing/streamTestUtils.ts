// this allows us to advance the response stream manually from within the tests
// create a trigger with this and pass it to makeAdvanceableTestStreamForTrigger
// and you can use trigger.advance() to advance the stream to the next chunk
export const createAdvanceStreamTrigger = () => {
  let handler: () => void;
  return {
    listen(fn: () => void) {
      handler = fn;
    },
    advance() {
      handler();
    },
  };
};

export const makeAdvanceableTestStreamForTrigger = (
  chunks: string[],
  trigger: {
    listen: (fn: () => void) => void;
    advance: () => void;
  },
) => {
  let chunkIndex = 0;
  const maxChunks = chunks.length;
  return new ReadableStream({
    start: (controller) => {
      trigger.listen(() => {
        if (chunkIndex === maxChunks) {
          controller.close();
          return;
        }
        const chunk = chunks[chunkIndex];
        if (chunk === "error") {
          controller.error(new Error("fake error from test stream chunk"));
          return;
        }
        controller.enqueue(chunk);
        chunkIndex++;
      });
    },
  });
};
