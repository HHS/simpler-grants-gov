import { unbatchStreamChunkJSON } from "./streamUtils";

describe("unbatchStreamChunkJson", () => {
  it("returns multiple json strings in an array where relevant", () => {
    expect(unbatchStreamChunkJSON("{key: 'value1'}{key: 'value2'}")).toEqual([
      "{key: 'value1'}",
      "{key: 'value2'}",
    ]);
  });
  it("does not split if batched chunk is not identified", () => {
    const chunk = "{key: 'value1', key2: 'value2'}";
    expect(unbatchStreamChunkJSON(chunk)).toEqual([chunk]);
  });
  it("handles whitespace", () => {
    expect(unbatchStreamChunkJSON("{key: 'value1'}  {key: 'value2'}")).toEqual([
      "{key: 'value1'}",
      "{key: 'value2'}",
    ]);
  });
});
