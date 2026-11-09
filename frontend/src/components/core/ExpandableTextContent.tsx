import DOMPurify from "isomorphic-dompurify";
import { splitMarkup } from "src/utils/generalUtils";

import ContentDisplayToggle from "src/components/core/ContentDisplayToggle";

export const ExpandableTextContent = ({
  textContent = "",
  showCallToAction,
  hideCallToAction,
  splitAt = 600,
  splitIfLongerThan = 750,
  emptyText = "--",
}: {
  textContent: string;
  showCallToAction: string;
  hideCallToAction: string;
  splitAt?: number;
  splitIfLongerThan?: number;
  emptyText?: string;
}) => {
  if (textContent?.length < splitIfLongerThan) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: textContent ? DOMPurify.sanitize(textContent) : emptyText,
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
          __html: textContent ? DOMPurify.sanitize(textContent) : emptyText,
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
