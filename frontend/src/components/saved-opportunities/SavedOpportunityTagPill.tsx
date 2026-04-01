import { USWDSIcon } from "src/components/USWDSIcon";
import { SavedOpportunityTag } from "./buildSavedOpportunityTags";

interface SavedOpportunityTagPillProps {
  tag: SavedOpportunityTag;
}

export function SavedOpportunityTagPill({ tag }: SavedOpportunityTagPillProps) {
  return (
    <span className="padding-x-105 padding-y-2px bg-base-lighter display-flex flex-align-center font-sans-3xs radius-sm">
      <USWDSIcon
        name="star"
        className="text-accent-warm-dark button-icon-md padding-right-05 flex-shrink-0"
      />
      <span aria-hidden="true">{tag.label}</span>
      <span className="usa-sr-only">{tag.screenReaderLabel}</span>
    </span>
  );
}
