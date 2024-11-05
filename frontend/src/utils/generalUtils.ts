// splits a string containing markup at a specified character length
// tracks open tags to ensure that split does not occur until all open tags are closed.
// will throw on malformed markup, so any callers will need to gracefully handle that error.
// Note that:
// * the character count is zero indexed
// * the split will happen on the first whitespace AFTER the supplied split point
// Refer to tests to see how this works in practice
export const splitMarkup = (
  markupString: string,
  splitAt: number,
): {
  preSplit: string;
  postSplit: string;
} => {
  if (splitAt > markupString.length) {
    return { preSplit: markupString, postSplit: "" };
  }
  const { preSplit, postSplit } = Array.from(markupString).reduce(
    (tracker, character, index) => {
      if (
        !tracker.splitComplete &&
        !tracker.tagOpen &&
        index > splitAt &&
        character.match(/\s/)
      ) {
        tracker.splitComplete = true;
      }
      if (tracker.splitComplete) {
        tracker.postSplit += character;
        return tracker;
      }
      if (character === "<") {
        if (tracker.openTagIndicator) {
          throw new Error("Malformed markup: unclosed tag");
        }
        tracker.openTagIndicator = true;
      }
      if (tracker.openTagIndicator && character === "/") {
        if (tracker.closeTagIndicator) {
          throw new Error("Malformed markup: improperly closed tag");
        }
        tracker.closeTagIndicator = true;
      }
      if (tracker.openTagIndicator && character === ">") {
        if (tracker.closeTagIndicator) {
          tracker.tagOpen--;
          tracker.closeTagIndicator = false;
          tracker.openTagIndicator = false;
          if (tracker.tagOpen < 0) {
            throw new Error("Malformed markup: tag open close mismatch");
          }
        } else {
          tracker.tagOpen++;
          tracker.openTagIndicator = false;
        }
      }
      tracker.preSplit += character;
      return tracker;
    },
    {
      preSplit: "",
      postSplit: "",
      tagOpen: 0,
      openTagIndicator: false,
      closeTagIndicator: false,
      splitComplete: false,
    },
  );
  return {
    preSplit,
    postSplit,
  };
};

// for a given string, find the first whitespace character following a given index
// useful for splitting strings of text at word breaks
export const findFirstWhitespace = (content: string, startAt: number): number =>
  content.substring(startAt).search(/\s/) + startAt;
