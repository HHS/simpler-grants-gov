import { splitMarkup } from "src/utils/generalUtils";

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
});

// <p>He didn't say any more but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores. The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon—for the intimate revelations of young men or at least the terms in which they express them are usually plagiaristic and marred by obvious suppressions.</p><p> Reserving judgments is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.</p>
