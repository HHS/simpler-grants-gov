import {
  findFirstWhitespace,
  formatTimestamp,
  isCurrentPath,
  queryParamsToQueryString,
  splitMarkup,
} from "src/utils/generalUtils";

describe("splitMarkup", () => {
  it("handles case where markdown string is shorter than split point", () => {
    const exampleMarkup = "Hi!";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 10);
    expect(preSplit).toEqual(exampleMarkup);
    expect(postSplit).toEqual("");
  });

  it("waits until whitespace to perform split (space)", () => {
    const exampleMarkup = "Hi! Exceptionally long word.";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 6);
    expect(preSplit).toEqual("Hi! Exceptionally");
    expect(postSplit).toEqual(" long word.");
  });

  it("waits until whitespace to perform split (line break)", () => {
    const exampleMarkup = `Hi! Exceptionally
    long word.`;
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 6);
    expect(preSplit).toEqual("Hi! Exceptionally");
    expect(postSplit).toEqual(`
    long word.`);
  });

  it("splits correctly with no tags", () => {
    const exampleMarkup =
      "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 73);
    expect(preSplit).toEqual(
      "In my younger and more vulnerable years my father gave me some advice that",
    );
    expect(postSplit).toEqual(" I've been turning over in my mind ever since.");
  });

  it("splits correctly with simple tags", () => {
    const exampleMarkup =
      "<div>In my younger and more vulnerable years my father gave me some advice</div> <div>that I've been turning over in my mind ever since.</div>";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 55);
    expect(preSplit).toEqual(
      "<div>In my younger and more vulnerable years my father gave me some advice</div>",
    );
    expect(postSplit).toEqual(
      " <div>that I've been turning over in my mind ever since.</div>",
    );
  });

  it("splits correctly on tag names", () => {
    const exampleMarkup =
      "<div>In my younger and more vulnerable years my father gave me some advice</div> <div>that I've been turning over in my mind ever since.</div>";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 78);
    expect(preSplit).toEqual(
      "<div>In my younger and more vulnerable years my father gave me some advice</div>",
    );
    expect(postSplit).toEqual(
      " <div>that I've been turning over in my mind ever since.</div>",
    );
  });

  it("splits correctly with nested tags", () => {
    const exampleMarkup =
      "<div>In <p>my younger</p> and more <p>vulnerable <strong>years my<ul><li>father</li><li>gave</li></ul>me</strong> some </p>advice</div> <div>that I've been turning over <strong>in</strong> my mind ever since.</div>";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 75);
    expect(preSplit).toEqual(
      "<div>In <p>my younger</p> and more <p>vulnerable <strong>years my<ul><li>father</li><li>gave</li></ul>me</strong> some </p>advice</div>",
    );
    expect(postSplit).toEqual(
      " <div>that I've been turning over <strong>in</strong> my mind ever since.</div>",
    );
  });
  it("ignores anything that is within quotes within a tag and allows it to pass through", () => {
    const exampleMarkup =
      "<div>In <a href='http://things' fake='<<>>>><<//'>my younger</a> and more <p>vulnerable <strong>years my<ul><li>father</li><li>gave</li></ul>me</strong> some </p>advice</div> <div>that I've been turning over <strong>in</strong> my mind ever since.</div>";
    const { preSplit, postSplit } = splitMarkup(exampleMarkup, 75);
    expect(preSplit).toEqual(
      "<div>In <a href='http://things' fake='<<>>>><<//'>my younger</a> and more <p>vulnerable <strong>years my<ul><li>father</li><li>gave</li></ul>me</strong> some </p>advice</div>",
    );
    expect(postSplit).toEqual(
      " <div>that I've been turning over <strong>in</strong> my mind ever since.</div>",
    );
  });
});

describe("findFirstWhitespace", () => {
  it("gives you the index of the first whitespace character in a string after a given index", () => {
    expect(findFirstWhitespace("hi there", 0)).toEqual(2);
    expect(findFirstWhitespace("hi there dude", 3)).toEqual(8);
    expect(
      findFirstWhitespace(
        `hi there
    dude`,
        3,
      ),
    ).toEqual(8);
  });
});

describe("queryParamsToQueryString", () => {
  it("will give you a question mark for nothing", () => {
    expect(queryParamsToQueryString({})).toEqual("?");
  });
  it("puts each provided key that has a value into a query string format", () => {
    expect(
      queryParamsToQueryString({
        status: "archived,closed",
        agency: "",
        eligibility: "individual",
      }),
    ).toEqual("?status=archived,closed&eligibility=individual&");
  });
});

describe("isCurrentPath", () => {
  it("returns true if the path matches the regex with passed link", () => {
    expect(isCurrentPath("/hello", "/en/hello")).toEqual(true);
    expect(
      isCurrentPath("/hello/whatever", "/es/hello/whatever?this=willgoaway"),
    ).toEqual(true);
  });
  it("returns false if the path does not match the regex with passed link", () => {
    expect(isCurrentPath("/hello/other-path", "/es/hello")).toEqual(false);
    expect(isCurrentPath("/hello", "/gr/hello")).toEqual(false);
  });
});

describe("formatTimestamp", () => {
  it("formats a valid ISO date string correctly", () => {
    const result = formatTimestamp("2026-01-23T15:30:00Z");
    expect(result).toContain("January 23, 2026");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("includes date in long format with year, month, and day", () => {
    const result = formatTimestamp("2025-12-25T10:15:00Z");
    expect(result).toContain("December 25, 2025");
  });

  it("includes time with hours and minutes", () => {
    const result = formatTimestamp("2026-06-15T08:45:30Z");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("includes timezone abbreviation in the output", () => {
    const result = formatTimestamp("2026-01-23T15:30:00Z");
    expect(result).toMatch(/[A-Z]{2,4}$/);
  });
});
