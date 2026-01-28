// splits a string containing markup at a specified character length
// tracks open tags to ensure that split does not occur until all open tags are closed.
// will throw on malformed markup, so any callers will need to gracefully handle that error.
// Note that:
// * the character count is zero indexed
// * the split will happen on the first whitespace AFTER the supplied split point

import { difference, isArray, isNumber, isString } from "lodash";
import { OptionalStringDict } from "src/types/generalTypes";

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
      // handle things like urls within tag params that need to be ignored
      if (
        tracker.openTagIndicator &&
        (character === `"` || character === `'`)
      ) {
        tracker.inQuotes = !tracker.inQuotes;
      }
      if (tracker.inQuotes) {
        tracker.preSplit += character;
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
      tagCharacters: "",
      inQuotes: false,
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

export const encodeText = (valueToEncode: string) =>
  new TextEncoder().encode(valueToEncode);

// a hack to get filenames to work on blob based downloads across all browsers
// see https://stackoverflow.com/a/48968694
export const saveBlobToFile = (blob: Blob, filename: string) => {
  const temporaryLink = document.createElement("a");
  document.body.appendChild(temporaryLink);
  const url = window.URL.createObjectURL(blob);
  temporaryLink.href = url;
  temporaryLink.download = filename;
  temporaryLink.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(temporaryLink);
  }, 0);
};

export const queryParamsToQueryString = (dict: OptionalStringDict) => {
  return Object.entries(dict).reduce((queryString, [key, value]) => {
    return value ? `${queryString}${key}=${value}&` : queryString;
  }, "?");
};

// note that the regexp is taking into account /en & /es localized pathnames
export const isCurrentPath = (href: string, currentPath: string): boolean =>
  !!currentPath.match(new RegExp(`^(?:/e[ns])?${href.split("?")[0]}`));

export function isExternalLink(href: string): boolean {
  return !!(href && href.includes("http"));
}

export const isSubset = <T>(subset: T[], superset: T[]) => {
  return !difference(subset, superset).length;
};

export const isBasicallyAnObject = (mightBeAnObject: unknown): boolean => {
  if (typeof mightBeAnObject === "boolean") {
    return false;
  }
  return (
    !!mightBeAnObject &&
    !isArray(mightBeAnObject) &&
    !isString(mightBeAnObject) &&
    !isNumber(mightBeAnObject)
  );
};

export const formatTimestamp = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  })}`;
};

export const getModifiedTimeDisplay = (
  updated_at: string,
  created_at: string,
  returnStr: string,
) => {
  const updatedTime = new Date(updated_at).getTime();
  const createdTime = new Date(created_at).getTime();
  const timeDiff = Math.abs(updatedTime - createdTime);

  if (timeDiff <= 5000) {
    return returnStr;
  }

  return formatTimestamp(updated_at);
};
