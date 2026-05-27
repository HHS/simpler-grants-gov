import DOMPurify from "isomorphic-dompurify";
import { splitMarkup } from "src/utils/generalUtils";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";

export const ExpandableTextContent = ({
  textContent = "",
  showCallToAction,
  hideCallToAction,
  splitAt = 600,
  splitIfLongerThan = 750,
}: {
  textContent: string;
  showCallToAction: string;
  hideCallToAction: string;
  splitAt?: number;
  splitIfLongerThan?: number;
}) => {
  if (textContent?.length < splitIfLongerThan) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: textContent ? DOMPurify.sanitize(textContent) : "--",
        }}
      />
    );
  }

  const purifiedSummary = DOMPurify.sanitize(textContent);

  const { preSplit, postSplit } = splitMarkup(purifiedSummary, splitAt);

  if (!postSplit) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: textContent ? DOMPurify.sanitize(textContent) : "--",
        }}
      />
    );
  }
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: preSplit + "...",
        }}
      />
      <ContentDisplayToggle
        showCallToAction={showCallToAction}
        hideCallToAction={hideCallToAction}
        positionButtonBelowContent={false}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: postSplit,
          }}
        />
      </ContentDisplayToggle>
    </>
  );
};
